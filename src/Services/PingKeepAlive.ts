export interface PingDriver {
    isOpen: () => boolean
    write: (data: string) => void
    getSessionId: () => string | undefined
    isManualDisconnect: () => boolean
}

export type PingListener = (timeRemaining: number, maxTime: number) => void

/**
 * Sends periodic PING:<sessionId> messages while the connection is open, and
 * parses PING:<timeRemaining>:<maxTime> responses. Does not disconnect on
 * session timeout itself - handleResponse() returns whether a timeout was
 * detected so WebSocketService (which owns disconnect()) can act on it,
 * avoiding a circular dependency back into the service.
 */
export class PingKeepAlive {
    private intervalId: NodeJS.Timeout | undefined
    private delayMs = 5000
    private paused = false
    private listeners: PingListener[] = []
    private sessionTimeoutListener: (() => void) | undefined

    constructor(private driver: PingDriver) {}

    setConfig(options: { delayMs?: number }): void {
        if (options.delayMs !== undefined) {
            this.delayMs = options.delayMs
        }
    }

    setPaused(paused: boolean): void {
        this.paused = paused
    }

    isPaused(): boolean {
        return this.paused
    }

    setSessionTimeoutListener(callback: (() => void) | undefined): void {
        this.sessionTimeoutListener = callback
    }

    addListener(listener: PingListener): () => void {
        this.listeners.push(listener)
        return () => {
            this.listeners = this.listeners.filter((l) => l !== listener)
        }
    }

    start(): void {
        if (this.intervalId) {
            return // Already running
        }

        const sendPing = () => {
            if (this.driver.isManualDisconnect()) {
                return
            }

            if (!this.paused && this.driver.isOpen()) {
                const pingmsg = `PING:${this.driver.getSessionId() || "none"}`
                try {
                    this.driver.write(pingmsg)
                } catch (error) {
                    console.error("Failed to send ping:", error)
                }
            }

            this.intervalId = setTimeout(sendPing, this.delayMs)
        }

        sendPing()
    }

    stop(): void {
        if (this.intervalId) {
            clearTimeout(this.intervalId)
            this.intervalId = undefined
        }
    }

    /**
     * Handles a PING response. Format: PING:timeRemaining:maxTime.
     * Returns true when timeRemaining <= 0 (session timeout) - the caller is
     * responsible for actually disconnecting.
     */
    handleResponse(parts: string[]): boolean {
        if (parts.length < 3) {
            return false
        }

        const timeRemaining = parseInt(parts[1], 10)
        const maxTime = parseInt(parts[2], 10)

        this.listeners.forEach((listener) => {
            try {
                listener(timeRemaining, maxTime)
            } catch (error) {
                console.error("Error in ping listener:", error)
            }
        })

        if (timeRemaining <= 0) {
            console.warn("Session timeout detected (timeRemaining <= 0)")
            if (this.sessionTimeoutListener) {
                this.sessionTimeoutListener()
            }
            return true
        }

        return false
    }
}
