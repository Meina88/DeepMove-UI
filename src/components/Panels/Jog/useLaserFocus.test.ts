// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/preact"
import { useLaserFocus } from "./useLaserFocus"
import { useUiContextFn } from "../../../contexts"

beforeEach(() => {
    useUiContextFn.haptic = () => undefined
    useUiContextFn.getValue = (id: string) => {
        if (id === "laserfocuspower") return 10
        if (id === "laser_max_power") return 1000
        return undefined
    }
})

describe("useLaserFocus", () => {
    it("does nothing and returns false when the machine is not idle", () => {
        const sendGcode = vi.fn()
        const { result } = renderHook(() => useLaserFocus({ isLaserMode: true, isIdle: false, sendGcode }))

        let toggled = false
        act(() => {
            toggled = result.current.toggleLaserFocus()
        })

        expect(toggled).toBe(false)
        expect(sendGcode).not.toHaveBeenCalled()
        expect(result.current.laserFocus).toBe(false)
    })

    it("enables laser focus and sends the M3/G1 sequence at the configured power", () => {
        const sendGcode = vi.fn()
        const { result } = renderHook(() => useLaserFocus({ isLaserMode: true, isIdle: true, sendGcode }))

        let toggled = false
        act(() => {
            toggled = result.current.toggleLaserFocus()
        })

        expect(toggled).toBe(true)
        expect(result.current.laserFocus).toBe(true)
        expect(sendGcode).toHaveBeenCalledWith("M3 S100")
        expect(sendGcode).toHaveBeenCalledWith("G1 F1000")
    })

    it("disables laser focus and sends the M5/G0 sequence on the second toggle", () => {
        const sendGcode = vi.fn()
        const { result } = renderHook(() => useLaserFocus({ isLaserMode: true, isIdle: true, sendGcode }))

        act(() => {
            result.current.toggleLaserFocus()
        })
        act(() => {
            result.current.toggleLaserFocus()
        })

        expect(result.current.laserFocus).toBe(false)
        expect(sendGcode).toHaveBeenCalledWith("M5 S0")
        expect(sendGcode).toHaveBeenCalledWith("G0")
    })

    it("resets laserFocus to false once the tool leaves laser mode", () => {
        const sendGcode = vi.fn()
        const { result, rerender } = renderHook(
            ({ isLaserMode }) => useLaserFocus({ isLaserMode, isIdle: true, sendGcode }),
            { initialProps: { isLaserMode: true } }
        )

        act(() => {
            result.current.toggleLaserFocus()
        })
        expect(result.current.laserFocus).toBe(true)

        rerender({ isLaserMode: false })

        expect(result.current.laserFocus).toBe(false)
    })
})
