import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ReconnectionManager } from "./ReconnectionManager"

describe("ReconnectionManager", () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it("starts with zero attempts and nothing pending", () => {
        const manager = new ReconnectionManager()
        expect(manager.getAttempts()).toBe(0)
        expect(manager.isPending()).toBe(false)
    })

    it("schedules a retry after baseDelayMs and reports the attempt/max counters", () => {
        const manager = new ReconnectionManager({ maxAttempts: 4, baseDelayMs: 2000 })
        const onRetry = vi.fn()

        const result = manager.scheduleRetry(onRetry)

        expect(result).toEqual({ kind: "scheduled", attempt: 1, maxAttempts: 4 })
        expect(manager.getAttempts()).toBe(1)
        expect(manager.isPending()).toBe(true)
        expect(onRetry).not.toHaveBeenCalled()

        vi.advanceTimersByTime(2000)
        expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it("reports exhausted once maxAttempts is reached, without scheduling further retries", () => {
        const manager = new ReconnectionManager({ maxAttempts: 2, baseDelayMs: 100 })
        const onRetry = vi.fn()

        expect(manager.scheduleRetry(onRetry).kind).toBe("scheduled")
        expect(manager.scheduleRetry(onRetry).kind).toBe("scheduled")
        expect(manager.scheduleRetry(onRetry)).toEqual({ kind: "exhausted", maxAttempts: 2 })
        expect(manager.getAttempts()).toBe(2)
    })

    it("skips scheduling once manual disconnect is set", () => {
        const manager = new ReconnectionManager({ maxAttempts: 4, baseDelayMs: 100 })
        manager.setManualDisconnect(true)

        expect(manager.scheduleRetry(vi.fn())).toEqual({ kind: "skipped-manual" })
        expect(manager.getAttempts()).toBe(0)
        expect(manager.isManualDisconnect()).toBe(true)
    })

    it("resetAttempts and cancel clear the counter and pending timer", () => {
        const manager = new ReconnectionManager({ maxAttempts: 4, baseDelayMs: 1000 })
        manager.scheduleRetry(vi.fn())
        expect(manager.isPending()).toBe(true)

        manager.cancel()
        expect(manager.isPending()).toBe(false)

        manager.resetAttempts()
        expect(manager.getAttempts()).toBe(0)
    })

    it("is no longer pending once the retry has fired", () => {
        // A fired timer must not keep reporting "pending", or a later failure
        // would be mistaken for one whose retry is already on its way.
        const manager = new ReconnectionManager({ maxAttempts: 4, baseDelayMs: 100 })
        manager.scheduleRetry(vi.fn())
        expect(manager.isPending()).toBe(true)

        vi.advanceTimersByTime(100)
        expect(manager.isPending()).toBe(false)
    })

    it("noteConnected forgets the attempts only after the link has stayed up for stableMs", () => {
        const manager = new ReconnectionManager({ maxAttempts: 4, baseDelayMs: 100, stableMs: 15000 })
        manager.scheduleRetry(vi.fn())
        manager.scheduleRetry(vi.fn())
        expect(manager.getAttempts()).toBe(2)

        manager.noteConnected()
        vi.advanceTimersByTime(14999)
        expect(manager.getAttempts()).toBe(2)

        vi.advanceTimersByTime(1)
        expect(manager.getAttempts()).toBe(0)
    })

    it("a link that drops again before it is stable keeps counting toward exhaustion", () => {
        // Two pages of one browser session take the socket from each other: each
        // reconnect succeeds and is lost again within seconds. Without this the
        // attempt counter would reset every time and they would never stop.
        const manager = new ReconnectionManager({ maxAttempts: 3, baseDelayMs: 100, stableMs: 15000 })

        for (let i = 0; i < 3; i++) {
            expect(manager.scheduleRetry(vi.fn()).kind).toBe("scheduled")
            vi.advanceTimersByTime(100) // reconnect attempt fires and succeeds...
            manager.noteConnected()
            vi.advanceTimersByTime(2000) // ...but the socket is taken away 2s later
        }

        expect(manager.scheduleRetry(vi.fn())).toEqual({ kind: "exhausted", maxAttempts: 3 })
    })

    it("cancel also stops a pending stability reset", () => {
        const manager = new ReconnectionManager({ maxAttempts: 4, baseDelayMs: 100, stableMs: 1000 })
        manager.scheduleRetry(vi.fn())
        manager.noteConnected()

        manager.cancel()
        vi.advanceTimersByTime(1000)
        expect(manager.getAttempts()).toBe(1)
    })

    it("setConfig updates maxAttempts and baseDelayMs", () => {
        const manager = new ReconnectionManager({ maxAttempts: 1, baseDelayMs: 5000 })
        manager.setConfig({ maxAttempts: 10, baseDelayMs: 10 })

        const onRetry = vi.fn()
        manager.scheduleRetry(onRetry)
        vi.advanceTimersByTime(10)
        expect(onRetry).toHaveBeenCalledTimes(1)
        expect(manager.scheduleRetry(vi.fn()).kind).toBe("scheduled") // would be exhausted at maxAttempts:1
    })
})
