// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/preact"
import { useHmiResetControl } from "./useHmiResetControl"
import { useUiContextFn } from "../../../contexts"

beforeEach(() => {
    useUiContextFn.haptic = () => undefined
    vi.useFakeTimers()
})

afterEach(() => {
    vi.useRealTimers()
})

describe("useHmiResetControl", () => {
    it("sends only a soft reset when the machine isn't alarmed", () => {
        const targetCommands = vi.fn()
        const { result } = renderHook(() => useHmiResetControl(false, targetCommands))

        act(() => {
            result.current.onResetPress()
        })

        expect(targetCommands).toHaveBeenCalledTimes(1)
        expect(targetCommands).toHaveBeenCalledWith("\x18")

        act(() => {
            vi.advanceTimersByTime(200)
        })
        // no unlock ever queued
        expect(targetCommands).toHaveBeenCalledTimes(1)
    })

    it("follows an alarmed soft reset with an unlock after the delay", () => {
        const targetCommands = vi.fn()
        const { result } = renderHook(() => useHmiResetControl(true, targetCommands))

        act(() => {
            result.current.onResetPress()
        })
        expect(targetCommands).toHaveBeenCalledTimes(1)
        expect(targetCommands).toHaveBeenLastCalledWith("\x18")

        act(() => {
            vi.advanceTimersByTime(120)
        })
        expect(targetCommands).toHaveBeenCalledTimes(2)
        expect(targetCommands).toHaveBeenLastCalledWith("$X")
    })

    it("sets resetBusy for a short window and ignores presses while busy", () => {
        const targetCommands = vi.fn()
        const { result } = renderHook(() => useHmiResetControl(false, targetCommands))

        act(() => {
            result.current.onResetPress()
        })
        expect(result.current.resetBusy).toBe(true)

        // A second press while still busy is a no-op.
        act(() => {
            result.current.onResetPress()
        })
        expect(targetCommands).toHaveBeenCalledTimes(1)

        act(() => {
            vi.advanceTimersByTime(350)
        })
        expect(result.current.resetBusy).toBe(false)
    })
})
