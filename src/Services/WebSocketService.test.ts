import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { WebSocketService, ControllerStatus } from "./WebSocketService"
import type { WebSocketAdapter } from "./WebSocketAdapter"

/** Stand-in for the browser's native socket: only the "close" listener is used by the service */
class FakeNativeSocket {
    private closeListeners: Array<() => void> = []
    addEventListener(_type: string, listener: () => void) {
        this.closeListeners.push(listener)
    }
    fireClose() {
        this.closeListeners.forEach((listener) => listener())
    }
}

function makeService() {
    let open = false
    let hasOpened = false
    let failOpens = 0
    let native = new FakeNativeSocket()
    const nativeSockets = [native]
    const textReaders: Array<(data: string) => void> = []
    const binaryReaders: Array<(data: ArrayBuffer) => void> = []
    const errorListeners: Array<(event: Event) => void> = []

    const adapter = {
        isOpen: vi.fn(() => open),
        // like the real adapter, a reconnection gets a brand new native socket
        open: vi.fn(async () => {
            if (failOpens > 0) {
                failOpens--
                throw new Error("WebSocket failed to connect")
            }
            // the adapter creates its first socket in its constructor; only later opens need a new one
            if (!open && hasOpened) {
                native = new FakeNativeSocket()
                nativeSockets.push(native)
            }
            open = true
            hasOpened = true
        }),
        close: vi.fn(async () => {
            open = false
        }),
        write: vi.fn(async () => {}),
        addReader: vi.fn((listener: (data: string) => void) => textReaders.push(listener)),
        addBinaryReader: vi.fn((listener: (data: ArrayBuffer) => void) => binaryReaders.push(listener)),
        addErrorListener: vi.fn((listener: (event: Event) => void) => errorListeners.push(listener)),
        getNativeWebSocket: vi.fn(() => native as unknown as WebSocket),
    }

    const toasts: Array<{ content: unknown; type: string }> = []
    const service = new WebSocketService(adapter as unknown as WebSocketAdapter, {
        addToast: (toast) => toasts.push(toast as { content: unknown; type: string }),
        clearModals: vi.fn(),
    })
    const context = {
        dialogs: { setShowKeepConnected: vi.fn() },
        activity: { stopPolling: vi.fn() },
        modalsCleared: vi.fn(),
        extensionsNotify: vi.fn(),
    }
    service.setServiceContext(context)

    return {
        service,
        adapter,
        context,
        toasts,
        currentNative: () => native,
        nativeSockets,
        /** the link goes down: the browser closes the socket */
        dropLink: () => {
            open = false
            native.fireClose()
        },
        failNextOpens: (count: number) => {
            failOpens = count
        },
        sendText: (data: string) => textReaders.forEach((reader) => reader(data)),
        sendBinary: (data: string) => binaryReaders.forEach((reader) => reader(new TextEncoder().encode(data).buffer)),
        fireError: () => errorListeners.forEach((listener) => listener(new Event("error"))),
    }
}

describe("WebSocketService control messages", () => {
    beforeEach(() => {
        vi.spyOn(console, "log").mockImplementation(() => {})
    })
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it("does not glue text control messages onto the next line of data", () => {
        const { service, sendText, sendBinary } = makeService()
        const lines: string[] = []
        // "core" carries the parsed lines; "stream" is the same binary data as raw chunks
        service.addDataListener((type, data) => {
            if (type === "core") lines.push(data)
        })

        // what FluidNC 3.x/4.x send around connection setup and keep-alive: text, no line terminator
        sendText("currentID:5")
        sendText("CURRENT_ID:5")
        sendText("PING:60000:60000")
        sendText("PING\n")
        sendBinary("<Run|MPos:1.000,2.000,3.000|FS:500,12000>\n")
        sendBinary("ok\n")

        expect(lines).toEqual(["<Run|MPos:1.000,2.000,3.000|FS:500,12000>", "ok"])
    })

    it("still handles the control messages themselves", () => {
        const { service, sendText } = makeService()

        sendText("currentID:7")

        expect(service.getSessionId()).toBe("7")
    })

    it("keeps passing other text frames through the line buffer, as before", () => {
        const { service, sendText } = makeService()
        const lines: string[] = []
        service.addDataListener((type, data) => {
            if (type === "core") lines.push(data)
        })

        sendText("[MSG:INFO: hello]\n")

        expect(lines).toEqual(["[MSG:INFO: hello]"])
    })
})

describe("WebSocketService reconnection", () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.spyOn(console, "log").mockImplementation(() => {})
        vi.spyOn(console, "warn").mockImplementation(() => {})
        vi.spyOn(console, "error").mockImplementation(() => {})
    })
    afterEach(() => {
        vi.useRealTimers()
        vi.restoreAllMocks()
    })

    it("reconnects after the link is lost, on a new socket", async () => {
        const t = makeService()
        await t.service.connect()
        const first = t.currentNative()

        t.dropLink()
        expect(t.service.status).toBe(ControllerStatus.CONNECTION_LOST)

        await vi.advanceTimersByTimeAsync(2000)

        expect(t.service.status).toBe(ControllerStatus.CONNECTED)
        expect(t.currentNative()).not.toBe(first)
        expect(t.nativeSockets).toHaveLength(2)
    })

    it("counts one lost link as one attempt, even when it is reported as an error and as a close", async () => {
        const t = makeService()
        await t.service.connect()

        t.fireError()
        t.dropLink()

        expect(t.service.getReconnectAttempts()).toBe(1)
        expect(t.service.isReconnectPending()).toBe(true)
    })

    it("counts one failed attempt as one attempt", async () => {
        const t = makeService()
        await t.service.connect()
        t.failNextOpens(1)
        t.dropLink()
        expect(t.service.getReconnectAttempts()).toBe(1)

        await vi.advanceTimersByTimeAsync(2000) // retry #1 fails
        expect(t.service.getReconnectAttempts()).toBe(2)
        expect(t.service.status).toBe(ControllerStatus.DISCONNECTED)

        await vi.advanceTimersByTimeAsync(2000) // retry #2 succeeds
        expect(t.service.status).toBe(ControllerStatus.CONNECTED)
    })

    it("gives up after the configured number of attempts", async () => {
        const t = makeService()
        await t.service.connect()
        t.failNextOpens(99)
        t.dropLink()

        await vi.advanceTimersByTimeAsync(2000 * 6)

        expect(t.adapter.open).toHaveBeenCalledTimes(1 + 4) // initial connect + 4 reconnection attempts
        expect(t.service.getReconnectAttempts()).toBe(4)
        expect(t.service.isReconnectPending()).toBe(false)
        expect(t.service.status).toBe(ControllerStatus.DISCONNECTED)
    })

    it("does not treat the first connection as a reconnection, but every later one", async () => {
        const t = makeService()
        const onReconnected = vi.fn()
        t.service.setReconnectedListener(onReconnected)

        await t.service.connect()
        expect(onReconnected).not.toHaveBeenCalled()

        t.dropLink()
        await vi.advanceTimersByTimeAsync(2000)
        expect(onReconnected).toHaveBeenCalledTimes(1)

        t.dropLink()
        await vi.advanceTimersByTimeAsync(2000)
        expect(onReconnected).toHaveBeenCalledTimes(2)
    })

    it("stops polling and clears modals when the link is lost, not only on a final disconnect", async () => {
        const t = makeService()
        await t.service.connect()

        t.dropLink()

        expect(t.context.activity.stopPolling).toHaveBeenCalled()
        expect(t.context.modalsCleared).toHaveBeenCalled()
        expect(t.context.extensionsNotify).toHaveBeenLastCalledWith("notification", { isConnected: false }, "all")
    })

    it("forgets the attempts only once the new link has stayed up", async () => {
        const t = makeService()
        await t.service.connect()
        t.dropLink()
        await vi.advanceTimersByTimeAsync(2000)
        expect(t.service.getReconnectAttempts()).toBe(1)

        await vi.advanceTimersByTimeAsync(15000)

        expect(t.service.getReconnectAttempts()).toBe(0)
    })

    it("two pages taking the socket from each other end up giving up instead of looping forever", async () => {
        const t = makeService()
        await t.service.connect()

        // every reconnection succeeds, and the other page takes the socket again 3s later
        for (let i = 0; i < 6; i++) {
            t.dropLink()
            await vi.advanceTimersByTimeAsync(2000 + 3000)
        }

        expect(t.service.getReconnectAttempts()).toBe(4)
        expect(t.service.status).toBe(ControllerStatus.DISCONNECTED)
    })

    it("a late close from a socket that was already replaced does not tear down the new link", async () => {
        const t = makeService()
        await t.service.connect()
        const old = t.currentNative()
        t.dropLink()
        await vi.advanceTimersByTimeAsync(2000)
        expect(t.service.status).toBe(ControllerStatus.CONNECTED)

        old.fireClose()

        expect(t.service.status).toBe(ControllerStatus.CONNECTED)
    })

    it("connect() called again on an open socket does not stack another close listener", async () => {
        const t = makeService()
        await t.service.connect()
        await t.service.connect()
        await t.service.connect()

        t.dropLink()

        // one lost link, one attempt: duplicated listeners would have reported it three times
        expect(t.service.getReconnectAttempts()).toBe(1)
    })

    it("a manual disconnect does not reconnect", async () => {
        const t = makeService()
        await t.service.connect()

        await t.service.disconnect("disconnected", true)
        t.dropLink()
        await vi.advanceTimersByTimeAsync(10000)

        expect(t.service.status).toBe(ControllerStatus.DISCONNECTED)
        expect(t.adapter.open).toHaveBeenCalledTimes(1)
    })

    it("disconnect(reason, false) - the HTTP watchdog - closes the socket and then recovers", async () => {
        const t = makeService()
        await t.service.connect()

        await t.service.disconnect("connectionlost", false)
        t.dropLink()
        await vi.advanceTimersByTimeAsync(2000)

        expect(t.service.status).toBe(ControllerStatus.CONNECTED)
    })
})
