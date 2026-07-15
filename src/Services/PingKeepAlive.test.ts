import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { PingKeepAlive, PingDriver } from "./PingKeepAlive"

function makeDriver(overrides: Partial<PingDriver> = {}): PingDriver {
    return {
        isOpen: () => true,
        write: vi.fn(),
        getSessionId: () => "abc123",
        isManualDisconnect: () => false,
        ...overrides,
    }
}

describe("PingKeepAlive", () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it("sends a PING:<sessionId> message immediately on start, then on every delay interval", () => {
        const driver = makeDriver()
        const ping = new PingKeepAlive(driver)
        ping.setConfig({ delayMs: 1000 })

        ping.start()
        expect(driver.write).toHaveBeenCalledWith("PING:abc123")
        expect(driver.write).toHaveBeenCalledTimes(1)

        vi.advanceTimersByTime(1000)
        expect(driver.write).toHaveBeenCalledTimes(2)
    })

    it("falls back to PING:none when there is no session id yet", () => {
        const driver = makeDriver({ getSessionId: () => undefined })
        const ping = new PingKeepAlive(driver)

        ping.start()
        expect(driver.write).toHaveBeenCalledWith("PING:none")
    })

    it("does not send while paused, but keeps rescheduling", () => {
        const driver = makeDriver()
        const ping = new PingKeepAlive(driver)
        ping.setConfig({ delayMs: 1000 })
        ping.setPaused(true)

        ping.start()
        expect(driver.write).not.toHaveBeenCalled()

        vi.advanceTimersByTime(1000)
        expect(driver.write).not.toHaveBeenCalled()

        ping.setPaused(false)
        vi.advanceTimersByTime(1000)
        expect(driver.write).toHaveBeenCalledTimes(1)
    })

    it("does not send once manual disconnect is set, but still reschedules itself", () => {
        let manual = false
        const driver = makeDriver({ isManualDisconnect: () => manual })
        const ping = new PingKeepAlive(driver)
        ping.setConfig({ delayMs: 1000 })

        manual = true
        ping.start()
        expect(driver.write).not.toHaveBeenCalled()
    })

    it("start() is a no-op while already running", () => {
        const driver = makeDriver()
        const ping = new PingKeepAlive(driver)
        ping.start()
        ping.start()
        expect(driver.write).toHaveBeenCalledTimes(1)
    })

    it("stop() cancels the scheduled ping", () => {
        const driver = makeDriver()
        const ping = new PingKeepAlive(driver)
        ping.setConfig({ delayMs: 1000 })
        ping.start()
        ping.stop()

        vi.advanceTimersByTime(5000)
        expect(driver.write).toHaveBeenCalledTimes(1) // only the initial send
    })

    it("handleResponse notifies listeners and returns false while time remains", () => {
        const ping = new PingKeepAlive(makeDriver())
        const listener = vi.fn()
        ping.addListener(listener)

        const timedOut = ping.handleResponse(["PING", "30", "60"])
        expect(listener).toHaveBeenCalledWith(30, 60)
        expect(timedOut).toBe(false)
    })

    it("handleResponse returns true and fires the session-timeout callback when time is exhausted", () => {
        const ping = new PingKeepAlive(makeDriver())
        const onTimeout = vi.fn()
        ping.setSessionTimeoutListener(onTimeout)

        const timedOut = ping.handleResponse(["PING", "0", "60"])
        expect(onTimeout).toHaveBeenCalledTimes(1)
        expect(timedOut).toBe(true)
    })

    it("handleResponse ignores malformed responses (fewer than 3 parts)", () => {
        const ping = new PingKeepAlive(makeDriver())
        const listener = vi.fn()
        ping.addListener(listener)

        expect(ping.handleResponse(["PING", "30"])).toBe(false)
        expect(listener).not.toHaveBeenCalled()
    })

    it("addListener's returned unregister function stops further notifications", () => {
        const ping = new PingKeepAlive(makeDriver())
        const listener = vi.fn()
        const unregister = ping.addListener(listener)

        unregister()
        ping.handleResponse(["PING", "30", "60"])
        expect(listener).not.toHaveBeenCalled()
    })
})
