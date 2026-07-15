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

    it("bumpAttempts increments the counter directly, without scheduling anything", () => {
        // Pins the pre-existing WebSocketService behavior where a WebSocket
        // error bumps the counter once directly, then scheduleRetry() bumps
        // it again - i.e. one error currently counts as two attempts.
        const manager = new ReconnectionManager({ maxAttempts: 4, baseDelayMs: 100 })
        manager.bumpAttempts()
        expect(manager.getAttempts()).toBe(1)
        expect(manager.isPending()).toBe(false)

        const result = manager.scheduleRetry(vi.fn())
        expect(result).toEqual({ kind: "scheduled", attempt: 2, maxAttempts: 4 })
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
