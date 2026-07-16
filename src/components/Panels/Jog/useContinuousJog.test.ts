// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/preact"
import { useContinuousJog, jogStepsXYZ } from "./useContinuousJog"
import { useUiContextFn } from "../../../contexts"

beforeEach(() => {
    useUiContextFn.haptic = () => undefined
    useUiContextFn.click = () => undefined
    vi.useFakeTimers()
})

afterEach(() => {
    vi.useRealTimers()
})

function setup(overrides: Partial<Parameters<typeof useContinuousJog>[0]> = {}) {
    const sendGcode = vi.fn()
    const setJogStepIndex = vi.fn()
    const params = {
        jogStepIndex: 0, // jogStepsXYZ[0] === 100
        setJogStepIndex,
        getFeedrateForStep: vi.fn(() => 1000),
        resolveAxis: (axis: string) => axis,
        sendGcode,
        ...overrides,
    }
    const { result } = renderHook(() => useContinuousJog(params))
    return { result, sendGcode, setJogStepIndex, getFeedrateForStep: params.getFeedrateForStep }
}

describe("useContinuousJog", () => {
    it("a short tap sends a single discrete jog move, not a continuous one", () => {
        const { result, sendGcode } = setup()
        const handlers = result.current.jogPressHandlers("X+")

        act(() => {
            handlers.onPointerDown()
        })
        // released before CONTINUOUS_JOG_DELAY elapses
        act(() => {
            handlers.onPointerUp()
        })

        expect(sendGcode).toHaveBeenCalledTimes(1)
        expect(sendGcode).toHaveBeenCalledWith(`$J=G91 G21 X+${jogStepsXYZ[0]} F1000`)
    })

    it("holding past the continuous-jog delay sends a continuous move, then cancels on release", () => {
        const { result, sendGcode } = setup()
        const handlers = result.current.jogPressHandlers("Y-")

        act(() => {
            handlers.onPointerDown()
        })
        act(() => {
            vi.advanceTimersByTime(250)
        })

        expect(sendGcode).toHaveBeenCalledWith(expect.stringContaining("$J=G91 G21 Y-5000 F1000"))

        act(() => {
            handlers.onPointerUp()
        })

        // the realtime jog-cancel byte, sent as its own command
        expect(sendGcode).toHaveBeenLastCalledWith("\x85")
    })

    it("bumps the jog step to index 1 when starting a Z jog at the 100mm step", () => {
        const { result, setJogStepIndex } = setup({ jogStepIndex: 0 })
        const handlers = result.current.jogPressHandlers("Z+")

        act(() => {
            handlers.onPointerDown()
        })

        expect(setJogStepIndex).toHaveBeenCalledWith(1)
    })

    it("does not bump the jog step for non-Z axes at the 100mm step", () => {
        const { result, setJogStepIndex } = setup({ jogStepIndex: 0 })
        const handlers = result.current.jogPressHandlers("X+")

        act(() => {
            handlers.onPointerDown()
        })

        expect(setJogStepIndex).not.toHaveBeenCalled()
    })

    it("forceCancelJog clears the pending timer so no continuous move is ever sent", () => {
        const { result, sendGcode } = setup()
        const handlers = result.current.jogPressHandlers("X+")

        act(() => {
            handlers.onPointerDown()
        })
        act(() => {
            result.current.forceCancelJog()
        })
        act(() => {
            vi.advanceTimersByTime(1000)
        })

        expect(sendGcode).not.toHaveBeenCalled()
    })

    it("onPointerLeave/onPointerCancel behave like forceCancelJog while a continuous move is active", () => {
        const { result, sendGcode } = setup()
        const handlers = result.current.jogPressHandlers("X-")

        act(() => {
            handlers.onPointerDown()
        })
        act(() => {
            vi.advanceTimersByTime(250)
        })
        sendGcode.mockClear()

        act(() => {
            handlers.onPointerLeave()
        })

        expect(sendGcode).toHaveBeenCalledWith("\x85")
    })

    it("cancelJog sends the realtime jog-cancel byte directly", () => {
        const { result, sendGcode } = setup()

        act(() => {
            result.current.cancelJog()
        })

        expect(sendGcode).toHaveBeenCalledWith("\x85")
    })

    it("sendJogCommand resolves the axis and uses the overridden step index", () => {
        const { result, sendGcode, getFeedrateForStep } = setup({
            resolveAxis: (axis: string) => axis.replace("Axis", "X"),
        })

        act(() => {
            result.current.sendJogCommand("Axis+", 2) // jogStepsXYZ[2] === 1
        })

        expect(getFeedrateForStep).toHaveBeenCalledWith("Axis+", jogStepsXYZ[2])
        expect(sendGcode).toHaveBeenCalledWith(`$J=G91 G21 X+${jogStepsXYZ[2]} F1000`)
    })
})
