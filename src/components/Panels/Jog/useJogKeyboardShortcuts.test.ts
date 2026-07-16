// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { renderHook } from "@testing-library/preact"
import { useJogKeyboardShortcuts } from "./useJogKeyboardShortcuts"

function dispatchKey(type: "keydown" | "keyup", code: string) {
    window.dispatchEvent(new KeyboardEvent(type, { code }))
}

describe("useJogKeyboardShortcuts", () => {
    it("does not attach any listeners when disabled", () => {
        const startJog = vi.fn()
        renderHook(() => useJogKeyboardShortcuts({ enabled: false, startJog, stopJog: vi.fn(), forceCancelJog: vi.fn() }))

        dispatchKey("keydown", "ArrowRight")

        expect(startJog).not.toHaveBeenCalled()
    })

    it("starts and stops the matching axis on keydown/keyup", () => {
        const startJog = vi.fn()
        const stopJog = vi.fn()
        renderHook(() => useJogKeyboardShortcuts({ enabled: true, startJog, stopJog, forceCancelJog: vi.fn() }))

        dispatchKey("keydown", "ArrowRight")
        expect(startJog).toHaveBeenCalledWith("X+")

        dispatchKey("keyup", "ArrowRight")
        expect(stopJog).toHaveBeenCalledWith("X+")
    })

    it("ignores key-repeat (does not re-trigger startJog while the key is already held)", () => {
        const startJog = vi.fn()
        renderHook(() => useJogKeyboardShortcuts({ enabled: true, startJog, stopJog: vi.fn(), forceCancelJog: vi.fn() }))

        dispatchKey("keydown", "PageUp")
        dispatchKey("keydown", "PageUp")
        dispatchKey("keydown", "PageUp")

        expect(startJog).toHaveBeenCalledTimes(1)
        expect(startJog).toHaveBeenCalledWith("Z+")
    })

    it("calls forceCancelJog on scroll", () => {
        const forceCancelJog = vi.fn()
        renderHook(() => useJogKeyboardShortcuts({ enabled: true, startJog: vi.fn(), stopJog: vi.fn(), forceCancelJog }))

        window.dispatchEvent(new Event("scroll"))

        expect(forceCancelJog).toHaveBeenCalled()
    })

    it("removes its listeners and calls forceCancelJog on unmount", () => {
        const startJog = vi.fn()
        const forceCancelJog = vi.fn()
        const { unmount } = renderHook(() =>
            useJogKeyboardShortcuts({ enabled: true, startJog, stopJog: vi.fn(), forceCancelJog })
        )

        unmount()
        expect(forceCancelJog).toHaveBeenCalledTimes(1)

        dispatchKey("keydown", "ArrowRight")
        expect(startJog).not.toHaveBeenCalled()
    })
})
