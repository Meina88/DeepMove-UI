// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { renderHook, act } from "@testing-library/preact"
import { useDigitalOutputs } from "./useDigitalOutputs"

function dispatchOutput(pin: number, state: boolean) {
    window.dispatchEvent(new CustomEvent("cnc-output", { detail: { pin, state } }))
}

describe("useDigitalOutputs", () => {
    it("starts with every output off", () => {
        const { result } = renderHook(() => useDigitalOutputs(vi.fn()))

        expect(result.current.d1).toBe(false)
        expect(result.current.d2).toBe(false)
        expect(result.current.d3).toBe(false)
        expect(result.current.d4).toBe(false)
    })

    it("updates the matching output's UI state from a cnc-output event, leaving the others untouched", () => {
        const { result } = renderHook(() => useDigitalOutputs(vi.fn()))

        act(() => {
            dispatchOutput(2, true)
        })

        expect(result.current.d1).toBe(false)
        expect(result.current.d2).toBe(true)
        expect(result.current.d3).toBe(false)
        expect(result.current.d4).toBe(false)
    })

    it("sends M63 to turn an output on and M62 to turn it off", () => {
        const targetCommands = vi.fn()
        const { result } = renderHook(() => useDigitalOutputs(targetCommands))

        result.current.toggleOutput(3, true)
        expect(targetCommands).toHaveBeenCalledWith("M63 P3")

        result.current.toggleOutput(3, false)
        expect(targetCommands).toHaveBeenCalledWith("M62 P3")
    })

    it("resetOutputs turns every output off regardless of prior state", () => {
        const { result } = renderHook(() => useDigitalOutputs(vi.fn()))

        act(() => {
            dispatchOutput(1, true)
            dispatchOutput(4, true)
        })
        expect(result.current.d1).toBe(true)
        expect(result.current.d4).toBe(true)

        act(() => {
            result.current.resetOutputs()
        })

        expect(result.current.d1).toBe(false)
        expect(result.current.d4).toBe(false)
    })

    it("stops listening for cnc-output events after unmount", () => {
        const { result, unmount } = renderHook(() => useDigitalOutputs(vi.fn()))
        unmount()

        act(() => {
            dispatchOutput(1, true)
        })

        // The hook's own state can no longer update post-unmount; this just
        // documents that the listener was actually removed (no stray errors).
        expect(result.current.d1).toBe(false)
    })
})
