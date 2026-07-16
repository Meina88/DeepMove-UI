// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { vibrate } from "./haptics"

describe("vibrate", () => {
    beforeEach(() => {
        Object.defineProperty(window.navigator, "vibrate", {
            value: vi.fn(),
            writable: true,
            configurable: true,
        })
    })

    it("does nothing when disabled", () => {
        vibrate(false)
        expect(window.navigator.vibrate).not.toHaveBeenCalled()
    })

    it("vibrates with the default pattern when enabled and no pattern given", () => {
        vibrate(true)
        expect(window.navigator.vibrate).toHaveBeenCalledWith(50)
    })

    it("vibrates with the given pattern when enabled", () => {
        vibrate(true, [50, 80, 50, 80, 50])
        expect(window.navigator.vibrate).toHaveBeenCalledWith([50, 80, 50, 80, 50])
    })

    it("does nothing when navigator.vibrate is unavailable", () => {
        Object.defineProperty(window.navigator, "vibrate", {
            value: undefined,
            writable: true,
            configurable: true,
        })
        expect(() => vibrate(true)).not.toThrow()
    })
})
