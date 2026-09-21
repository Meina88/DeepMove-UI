import { WebSocketAdapter } from "./WebSocketAdapter"
import { sleep } from "../utils"
import { Command } from "./Commands/Command"
import type { Toast } from "../contexts/ToastsContext"

import {
    NotificationHandler,
    isControlMessage,
    parseNotification,
    parseError,
    createConnectionErrorToast,
    createReconnectionToast,
    createMaxReconnectionToast,
} from "./NotificationHandlers"
import { ReconnectionManager } from "./ReconnectionManager"
import { PingKeepAlive } from "./PingKeepAlive"
import { SessionManager } from "./SessionManager"
import { CommandQueue } from "./CommandQueue"
import { extractLines } from "./LineBuffer"

export enum ControllerStatus {
    CONNECTION_LOST,
    DISCONNECTED,
    CONNECTING,
    CONNECTED,
    UNKNOWN_DEVICE,
}

export type ControllerStatusListener = (status: ControllerStatus) => void

/**
 * Service context for dependency injection
 * Provides access to app-level contexts from within the service
 */
export interface ServiceContext {
    dialogs: {
        setShowKeepConnected: (show: boolean) => void
    }
    activity?: {
        stopPolling: (id?: string) => void
    }
    modalsCleared?: () => void
    extensionsNotify?: (type: string, data: any, targetId?: string) => void
    uiSettings?: {
        getValue: (id: string) => any
    }
}

export class WebSocketService {
    private wsAdapter: WebSocketAdapter
    private buffer: string = ""
    private commandQueue = new CommandQueue()
    private _status: ControllerStatus = ControllerStatus.DISCONNECTED
    private statusListeners: ControllerStatusListener[] = []

    // Reconnection, ping/keep-alive and session bookkeeping are delegated to
    // their own collaborators; this class is left orchestrating what happens
    // at each transition (toasts, status, cleanup).
    private reconnection = new ReconnectionManager()
    private session = new SessionManager()
    private ping: PingKeepAlive

    // Notification handler (optional)
    private notificationHandler: NotificationHandler | undefined

    // Error handler (called when ERROR message received from controller)
    private errorHandler: ((errorCode: string, errorMessage: string) => void) | undefined

    // Data routing (for core message processing)
    private dataListeners: Array<(type: string, data: string) => void> = []

    // Connection state listener (for UI updates)
    // Matches UiContext ConnectionState: { connected: boolean; page: string; extraMsg?: string; updating?: boolean }
    private connectionStateListener:
        | ((state: { connected: boolean; page: string; extraMsg?: string; updating?: boolean }) => void)
        | undefined

    // Service context for dependency injection (app-level contexts)
    private serviceContext: ServiceContext | undefined

    // Set once the first connection succeeds, so later ones can be told apart as reconnections
    private hasConnectedBefore = false
    private reconnectedListener: (() => void) | undefined
    // Native socket that already carries our "close" listener (there is one per socket)
    private closeListenerSocket: WebSocket | undefined

    constructor(wsAdapter: WebSocketAdapter, notificationHandler?: NotificationHandler) {
        this.wsAdapter = wsAdapter
        this.notificationHandler = notificationHandler

        this.ping = new PingKeepAlive({
            isOpen: () => this.wsAdapter.isOpen(),
            write: (data) => this.wsAdapter.write(data),
            getSessionId: () => this.session.getSessionId(),
            isManualDisconnect: () => this.reconnection.isManualDisconnect(),
        })

        // Register main data listener
        this.wsAdapter.addReader(this.onTextData)
        this.wsAdapter.addReader(this._handleSystemMessage)

        // Register binary data listener for terminal/stream data
        this.wsAdapter.addBinaryReader(this._handleBinaryData)

        // Register error listener
        this.wsAdapter.addErrorListener(this._handleWebSocketError)
    }

    /**
     * Sets the service context for dependency injection
     * Provides access to app-level contexts (connectionSettings, dialogs, etc.)
     */
    setServiceContext(context: ServiceContext): void {
        this.serviceContext = context
    }

    /**
     * Establishes connection and initializes the controller
     * Automatically attempts to reconnect on connection loss
     */
    async connect(): Promise<ControllerStatus> {
        try {
            this.status = ControllerStatus.CONNECTING
            this.reconnection.setManualDisconnect(false)
            this._updateConnectionState({ connected: false, page: "connecting" })
            if (!this.wsAdapter.isOpen()) {
                await this.wsAdapter.open()
            }

            this.status = ControllerStatus.CONNECTED
            // The attempt counter is only forgotten once this link proves stable
            this.reconnection.noteConnected()

            // Start ping mechanism
            this.ping.start()

            // Update connection state
            this._updateConnectionState({ connected: true, page: "/" })

            // Notify extensions that we're connected
            if (this.serviceContext?.extensionsNotify) {
                this.serviceContext.extensionsNotify("notification", { isConnected: true }, "all")
            }

            // Set up disconnect listener for auto-reconnection (once per native socket:
            // connect() may be called again while the same socket is still open)
            const nativeSocket = this.wsAdapter.getNativeWebSocket()
            if (this.closeListenerSocket !== nativeSocket) {
                this.closeListenerSocket = nativeSocket
                nativeSocket.addEventListener("close", () => {
                    // A late "close" from a socket that has since been replaced says nothing about the current link
                    if (nativeSocket === this.wsAdapter.getNativeWebSocket() && this.status === ControllerStatus.CONNECTED) {
                        this._handleConnectionLost()
                    }
                })
            }

            // Whatever was stopped when the previous link was lost (polling, ...) needs restarting
            const isReconnection = this.hasConnectedBefore
            this.hasConnectedBefore = true
            if (isReconnection && this.reconnectedListener) {
                try {
                    this.reconnectedListener()
                } catch (error) {
                    console.error("Error in reconnected listener:", error)
                }
            }

            return this.status
        } catch (error) {
            console.error("Failed to connect to controller:", error)
            this.status = ControllerStatus.DISCONNECTED
            this._scheduleReconnection()
            throw error
        }
    }

    /**
     * Disconnects from the controller
     * @param reason - Reason for disconnection (for UI feedback)
     * @param stopReconnect - If true, marks as manually disconnected (no auto-reconnect)
     */
    async disconnect(reason: string = "disconnected", stopReconnect: boolean = true): Promise<void> {
        console.log("Disconnect:", reason);

        this._updateConnectionState({ connected: false, page: reason })
        this.ping.stop()
        if (stopReconnect) {
            this.reconnection.setManualDisconnect(true)
            this.status = ControllerStatus.DISCONNECTED
            this.reconnection.cancel()
        }

        this._performDisconnectCleanup()
        return this.wsAdapter.close()
    }

    /**
     * Handles connection loss and initiates auto-reconnection
     */
    private _handleConnectionLost(): void {
        console.log("Connection lost, attempting auto-reconnect")
        this.status = ControllerStatus.CONNECTION_LOST
        this._updateConnectionState({ connected: false, page: "connectionlost" })
        this._showToast(createConnectionErrorToast("connectionlost"))
        // Same cleanup as a final disconnect: HTTP polling would only fail (and
        // toast) while there is no socket to route the commands to, and open
        // modals belong to the session that just ended. Polling is restarted
        // through the reconnected listener.
        this._performDisconnectCleanup()
        this._scheduleReconnection()
    }

    /**
     * Schedules a reconnection attempt via ReconnectionManager, and reacts to
     * whichever of the three outcomes it reports.
     */
    private _scheduleReconnection(): void {
        // One failure can be reported through several paths (socket error event,
        // close event, a failed connect()); a retry that is already on its way
        // must not be counted, toasted and rescheduled again for each of them.
        if (this.reconnection.isPending()) {
            return
        }

        // connect() schedules its own next attempt when it fails, so a failure here is not handled again
        const result = this.reconnection.scheduleRetry(() => {
            this.connect().catch(() => {})
        })

        switch (result.kind) {
            case "skipped-manual":
                return
            case "exhausted":
                console.error(`Max reconnection attempts (${result.maxAttempts}) reached`)
                this.status = ControllerStatus.DISCONNECTED
                this._showToast(createMaxReconnectionToast())
                this._updateConnectionState({ connected: false, page: "connectionlost" })
                this._performDisconnectCleanup()
                return
            case "scheduled":
                this._showToast(createReconnectionToast(result.attempt, result.maxAttempts))
                return
        }
    }

    /**
     * Performs disconnect cleanup (called when max reconnections reached)
     * Stops polling, clears modals, and notifies extensions
     */
    private _performDisconnectCleanup(): void {
        // Stop any polling activity
        if (this.serviceContext?.activity) {
            this.serviceContext.activity.stopPolling()
        }

        // Clear all modals
        if (this.serviceContext?.modalsCleared) {
            this.serviceContext.modalsCleared()
        }

        // Notify extensions that we're disconnected
        if (this.serviceContext?.extensionsNotify) {
            this.serviceContext.extensionsNotify("notification", { isConnected: false }, "all")
        }
    }

    /**
     * Sets or updates the notification handler
     */
    setNotificationHandler(handler: NotificationHandler | undefined): void {
        this.notificationHandler = handler
    }

    /**
     * Displays a toast notification if handler is available
     */
    private _showToast(toast: Omit<Toast, "id">): void {
        if (this.notificationHandler) {
            this.notificationHandler.addToast(toast)
        } else {
            console.log(`[${toast.type.toUpperCase()}] ${toast.content}`)
        }
    }

    /**
     * Handles incoming system messages (NOTIFICATION, ERROR, PING, CURRENTID, etc.)
     * Using arrow function to preserve 'this' context when passed as a callback
     */
    private _handleSystemMessage = (message: string): void => {
        const parts = message.split(":")
        if (parts.length < 2) {
            return
        }

        const messageType = parts[0].toUpperCase()

        switch (messageType) {
            case "CURRENTID": {
                // Receive and store session ID both internally and in service context
                if (parts[1]) {
                    const sessionId = parts[1]
                    console.log(`Received session ID: ${  sessionId}`)
                    this.setSessionId(sessionId)
                }
                break
            }
            case "ACTIVEID": {
                // Another session connected - check if it's a different session
                if (parts[1]) {
                    const incomingSessionId = parts[1]

                    // Disconnect if this is a different session ID than ours
                    if (incomingSessionId !== this.getSessionId()) {
                        if ((this.serviceContext?.uiSettings?.getValue("disconnectonotherlogin") ?? true)) {
                            console.warn(`Another session connected with different ID ${incomingSessionId}, disconnecting`)
                            this.disconnect("already connected")
                        }
                        else
                            console.log(`Another session connected with different ID ${incomingSessionId}, but disconnectonotherlogin = false`)
                    }
                }
                break
            }
            case "PING": {
                // Handle ping response
                this._handlePingResponse(parts)
                break
            }
            case "NOTIFICATION": {
                console.log(`Notification: ${  message}`)

                const notification = parseNotification(message)
                if (notification) {
                    this._showToast(notification)
                }
                break
            }
            case "ERROR": {
                console.log(message)

                // Parse error and call error handler if set
                const parts = message.split(":")
                if (parts.length >= 3) {
                    const errorCode = parts[1]
                    const errorMessage = parts.slice(2).join(":")

                    // Call error handler if registered (for aborting HTTP requests, etc.)
                    if (this.errorHandler) {
                        this.errorHandler(errorCode, errorMessage)
                    }
                }

                const error = parseError(message)
                if (error) {
                    this._showToast(error)
                }
                break
            }
        }
    }

    /**
     * Text frames. Anything the controller sends this way that is a control
     * message (currentID, PING, ...) is handled by _handleSystemMessage and
     * must stay out of the line buffer, see isControlMessage().
     */
    private onTextData = (data: string): void => {
        if (isControlMessage(data)) {
            return
        }
        this.onData(data)
    }

    private onData = (data: string): void => {
        const { lines, remainder } = extractLines(this.buffer, data)
        this.buffer = remainder

        for (const line of lines) {
            const routedTo = this.commandQueue.routeLine(line)
            if (!routedTo) {
                // Route unhandled core messages to data listeners
                console.log(`<<< ${  line}`)
                this._notifyDataListeners("core", line)
            }
        }
    }

    /**
     * Writes raw data to the controller
     */
    async write(data: string | Buffer): Promise<void> {
        // Wait for other commands to finish
        await this.commandQueue.waitUntilIdle()

        const stringData = typeof data === "string" ? data : data.toString()
        await this.wsAdapter.write(stringData)
        await sleep(100)
    }

    /**
     * Sends a command and waits for response
     */
    async send<T extends Command>(command: T, timeoutMs: number = 0): Promise<T> {
        if (!this.wsAdapter.isOpen()) {
            return command
        }

        if (command.debugSend) {
            console.log(`sending ${  command.getCommand()}`)
        }

        // Wait for other commands to finish
        await this.commandQueue.waitUntilIdle()

        this.commandQueue.enqueue(command)
        const result = new Promise<T>((resolve, reject) => {
            let timer: NodeJS.Timeout | undefined
            if (timeoutMs > 0) {
                timer = setTimeout(() => {
                    this.commandQueue.remove(command)
                    reject("Command timed out")
                }, timeoutMs)
            }
            (command as Command).onDone = async () => {
                if (timer) {
                    clearTimeout(timer)
                }
                resolve(command)
            }
        })

        this.buffer = ""
        await this.wsAdapter.write(`${command.getCommand()  }\n`)
        return result
    }

    /**
     * Reconnects to the controller
     */
    async hardReset(): Promise<void> {
        this.status = ControllerStatus.CONNECTING
        try {
            this.reconnection.resetAttempts()
            await this.disconnect("disconnected", false)
            await sleep(500)
            await this.connect()
        } catch (error) {
            console.error("Hard reset failed:", error)
            this.status = ControllerStatus.DISCONNECTED
            throw error
        }
    }

    /**
     * Configures auto-reconnection settings
     */
    setReconnectConfig(options: { maxAttempts?: number; baseDelayMs?: number }): void {
        this.reconnection.setConfig(options)
    }

    /**
     * Gets current reconnection attempt count
     */
    getReconnectAttempts(): number {
        return this.reconnection.getAttempts()
    }

    /**
     * Checks if a reconnection is pending
     */
    isReconnectPending(): boolean {
        return this.reconnection.isPending()
    }

    /**
     * Sets the session ID (typically from CURRENTID message)
     */
    setSessionId(sessionId: string): void {
        this.session.setSessionId(sessionId)
    }

    /**
     * Gets the current session ID
     */
    getSessionId(): string | undefined {
        return this.session.getSessionId()
    }

    /**
     * Pauses ping messages (useful during HTTP requests)
     */
    setPingPaused(paused: boolean): void {
        this.ping.setPaused(paused)
    }

    /**
     * Checks if ping is paused
     */
    isPingPausedStatus(): boolean {
        return this.ping.isPaused()
    }

    /**
     * Configures ping settings
     */
    setPingConfig(options: { delayMs?: number }): void {
        this.ping.setConfig(options)
    }

    /**
     * Handles PING response messages, and disconnects on session timeout
     * (PingKeepAlive detects the timeout but does not call disconnect()
     * itself, to avoid a circular dependency back into this class)
     */
    private _handlePingResponse(parts: string[]): void {
        const timedOut = this.ping.handleResponse(parts)
        if (timedOut) {
            this.disconnect("sessiontimeout", true)
        }
    }

    /**
     * Adds a listener for ping responses
     * Called when PING response is received from controller
     */
    addPingListener(listener: (timeRemaining: number, maxTime: number) => void): () => void {
        return this.ping.addListener(listener)
    }

    /**
     * Sets a callback invoked after every successful connection except the
     * first one, i.e. once the link has been re-established after a loss
     */
    setReconnectedListener(callback: (() => void) | undefined): void {
        this.reconnectedListener = callback
    }

    /**
     * Sets a callback for session timeout
     */
    setSessionTimeoutListener(callback: (() => void) | undefined): void {
        this.ping.setSessionTimeoutListener(callback)
    }

    /**
     * Sets a callback for when ERROR messages are received from the controller
     * Allows app to handle errors (e.g., abort HTTP requests)
     */
    setErrorHandler(callback: ((errorCode: string, errorMessage: string) => void) | undefined): void {
        this.errorHandler = callback
    }

    /**
     * Adds a status listener
     */
    addListener(listener: ControllerStatusListener): void {
        this.statusListeners.push(listener)
    }

    /**
     * Removes a status listener
     */
    removeListener(listener: ControllerStatusListener): void {
        this.statusListeners = this.statusListeners.filter((l) => l !== listener)
    }

    /**
     * Sets the status and notifies all listeners
     */
    set status(status: ControllerStatus) {
        this._status = status
        this.statusListeners.forEach((l) => l(status))
    }

    /**
     * Gets the current status
     */
    get status(): ControllerStatus {
        return this._status
    }

    /**
     * Handles binary data (terminal/stream data from ArrayBuffer)
     */
    private _handleBinaryData = (data: ArrayBuffer): void => {
        try {
            const decodedString = new TextDecoder("utf-8").decode(data)
            // Route binary data to listeners as stream type
            this._notifyDataListeners("stream", decodedString)
            this.onData(decodedString)
        } catch (error) {
            console.error("Error decoding binary data:", error)
        }
    }

    /**
     * Handles WebSocket errors (equivalent to onErrorCB in WsContext)
     * Shows error toast and increments reconnection counter
     */
    private _handleWebSocketError = (_error: Event): void => {
        console.log("WebSocket error occurred")

        this._updateConnectionState({ connected: false, page: "error" })
        // Show error toast to user
        this._showToast({
            content: "WebSocket connection error. Attempting to reconnect...",
            type: "error",
        })

        this._scheduleReconnection()
    }

    /**
     * Adds a listener for core data routing
     * Called for non-command messages that should be processed by the UI
     */
    addDataListener(listener: (type: string, data: string) => void): () => void {
        this.dataListeners.push(listener)
        // Return unregister function
        return () => {
            this.dataListeners = this.dataListeners.filter((l) => l !== listener)
        }
    }

    /**
     * Notifies all data listeners
     */
    private _notifyDataListeners(type: string, data: string): void {
        this.dataListeners.forEach((listener) => {
            try {
                listener(type, data)
            } catch (error) {
                console.error("Error in data listener:", error)
            }
        })
    }

    /**
     * Sets the connection state listener for UI updates
     */
    setConnectionStateListener(
        listener:
            | ((state: { connected: boolean; page: string; extraMsg?: string; updating?: boolean }) => void)
            | undefined
    ): void {
        this.connectionStateListener = listener
    }

    /**
     * Updates connection state and notifies UI
     */
    private _updateConnectionState(state: {
        connected: boolean
        page: string
        extraMsg?: string
        updating?: boolean
    }): void {
        if (this.connectionStateListener) {
            try {
                this.connectionStateListener(state)
            } catch (error) {
                console.error("Error in connection state listener:", error)
            }
        }
    }

    /**
     * Gets the native WebSocket for advanced usage or fallback scenarios
     */
    getNativeWebSocket(): WebSocket {
        return this.wsAdapter.getNativeWebSocket()
    }
}
