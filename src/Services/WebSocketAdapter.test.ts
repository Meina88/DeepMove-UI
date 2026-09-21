import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { WebSocketAdapter } from "./WebSocketAdapter"

class FakeWebSocket {
    static CONNECTING = 0
    static OPEN = 1
    static CLOSING = 2
    static CLOSED = 3
    static instances: FakeWebSocket[] = []

    readyState = FakeWebSocket.CONNECTING
    binaryType = "blob"
    onopen: (() => void) | null = null
    onmessage: ((event: { data: unknown }) => void) | null = null
    onerror: ((event: unknown) => void) | null = null
    onclose: (() => void) | null = null
    sent: string[] = []
    private closeListeners: Array<() => void> = []

    constructor(
        public url: string,
        public protocol: string
    ) {
        FakeWebSocket.instances.push(this)
    }

    send(data: string) {
        this.sent.push(data)
    }
    addEventListener(_type: "close", listener: () => void) {
        this.closeListeners.push(listener)
    }
    removeEventListener(_type: "close", listener: () => void) {
        this.closeListeners = this.closeListeners.filter((l) => l !== listener)
    }
    close() {
        this.serverClose()
    }

    // --- test helpers: what the network would do
    serverOpen() {
        this.readyState = FakeWebSocket.OPEN
        this.onopen?.()
    }
    serverClose() {
        this.readyState = FakeWebSocket.CLOSED
        this.onclose?.()
        this.closeListeners.forEach((l) => l())
    }
    serverError() {
        this.onerror?.({ type: "error" })
    }
    serverMessage(data: unknown) {
        this.onmessage?.({ data })
    }
}

const latest = () => FakeWebSocket.instances[FakeWebSocket.instances.length - 1]

describe("WebSocketAdapter", () => {
    beforeEach(() => {
        FakeWebSocket.instances = []
        vi.stubGlobal("WebSocket", FakeWebSocket)
        vi.useFakeTimers()
        vi.spyOn(console, "log").mockImplementation(() => {})
        vi.spyOn(console, "error").mockImplementation(() => {})
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.unstubAllGlobals()
        vi.restoreAllMocks()
    })

    it("connects with the webui-v3 subprotocol and binary frames as ArrayBuffer", () => {
        new WebSocketAdapter("ws://board:80")

        expect(FakeWebSocket.instances).toHaveLength(1)
        expect(latest().url).toBe("ws://board:80")
        expect(latest().protocol).toBe("webui-v3")
        expect(latest().binaryType).toBe("arraybuffer")
    })

    it("open() resolves once the socket opens", async () => {
        const adapter = new WebSocketAdapter("ws://board:80")
        const opened = adapter.open()

        await vi.advanceTimersByTimeAsync(250)
        latest().serverOpen()
        await vi.advanceTimersByTimeAsync(100)

        await expect(opened).resolves.toBeUndefined()
        expect(adapter.isOpen()).toBe(true)
    })

    it("open() rejects when the socket closes before opening", async () => {
        const adapter = new WebSocketAdapter("ws://board:80")
        const opened = adapter.open()
        const rejection = expect(opened).rejects.toThrow("failed to connect")

        latest().serverClose()
        await vi.advanceTimersByTimeAsync(100)

        await rejection
    })

    it("open() gives up, and closes the socket, if it never opens", async () => {
        const adapter = new WebSocketAdapter("ws://board:80")
        const opened = adapter.open(1000)
        const rejection = expect(opened).rejects.toThrow("timeout")

        await vi.advanceTimersByTimeAsync(1200)

        await rejection
        expect(latest().readyState).toBe(FakeWebSocket.CLOSED)
    })

    it("open() after a close creates a brand new socket instead of reusing the dead one", async () => {
        const adapter = new WebSocketAdapter("ws://board:80")
        const first = latest()
        first.serverOpen()
        first.serverClose()
        expect(adapter.isOpen()).toBe(false)

        const reopened = adapter.open()
        expect(FakeWebSocket.instances).toHaveLength(2)
        const second = latest()
        expect(second).not.toBe(first)
        expect(second.url).toBe("ws://board:80")
        expect(second.protocol).toBe("webui-v3")

        second.serverOpen()
        await vi.advanceTimersByTimeAsync(100)
        await expect(reopened).resolves.toBeUndefined()
        expect(adapter.isOpen()).toBe(true)
    })

    it("does not create a second socket while the first one is still connecting or open", async () => {
        const adapter = new WebSocketAdapter("ws://board:80")
        const pending = adapter.open()
        latest().serverOpen()
        await vi.advanceTimersByTimeAsync(100)
        await pending

        void adapter.open()
        expect(FakeWebSocket.instances).toHaveLength(1)
    })

    it("keeps delivering data and errors to listeners registered before the reconnection", async () => {
        const adapter = new WebSocketAdapter("ws://board:80")
        const onText = vi.fn()
        const onBinary = vi.fn()
        const onError = vi.fn()
        adapter.addReader(onText)
        adapter.addBinaryReader(onBinary)
        adapter.addErrorListener(onError)

        latest().serverOpen()
        latest().serverClose()
        const reopened = adapter.open()
        latest().serverOpen()
        await vi.advanceTimersByTimeAsync(100)
        await reopened

        const bytes = new ArrayBuffer(2)
        latest().serverMessage("currentID:5")
        latest().serverMessage(bytes)
        latest().serverError()

        expect(onText).toHaveBeenCalledWith("currentID:5")
        expect(onBinary).toHaveBeenCalledWith(bytes)
        expect(onError).toHaveBeenCalledTimes(1)
    })

    it("ignores events from a socket that has already been replaced", async () => {
        const adapter = new WebSocketAdapter("ws://board:80")
        const onText = vi.fn()
        const onError = vi.fn()
        adapter.addReader(onText)
        adapter.addErrorListener(onError)
        const old = latest()
        old.serverOpen()
        old.readyState = FakeWebSocket.CLOSED // dropped without its close event having arrived yet

        const reopened = adapter.open()
        latest().serverOpen()
        await vi.advanceTimersByTimeAsync(100)
        await reopened

        // late events from the dead socket
        old.serverMessage("PING:60000:60000")
        old.serverError()
        old.serverClose()

        expect(onText).not.toHaveBeenCalled()
        expect(onError).not.toHaveBeenCalled()
        expect(adapter.isOpen()).toBe(true) // the stale "close" must not mark the new link closed
    })

    it("close() also closes a socket that is still connecting", async () => {
        const adapter = new WebSocketAdapter("ws://board:80")
        const socket = latest()

        await adapter.close()

        expect(socket.readyState).toBe(FakeWebSocket.CLOSED)
    })

    it("write() sends text and refuses when the socket is not open", async () => {
        const adapter = new WebSocketAdapter("ws://board:80")
        await expect(adapter.write("PING:none")).rejects.toThrow("not connected")

        latest().serverOpen()
        await adapter.write("PING:none")
        expect(latest().sent).toEqual(["PING:none"])
    })
})
