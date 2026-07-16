// @vitest-environment jsdom
import { describe, it, expect } from "vitest"
import { renderHook } from "@testing-library/preact"
import { useHmiMachineState } from "./useHmiMachineState"

describe("useHmiMachineState", () => {
    it("defaults to offline/idle when there is no status yet", () => {
        const { result } = renderHook(() => useHmiMachineState(undefined))

        expect(result.current.effectiveState).toBe("Offline")
        expect(result.current.isAlarm).toBe(false)
        expect(result.current.isIdle).toBe(true)
        expect(result.current.isLatched).toBe(false)
    })

    it("tracks Idle state directly", () => {
        const { result } = renderHook(() => useHmiMachineState({ state: "Idle" }))

        expect(result.current.effectiveState).toBe("Idle")
        expect(result.current.isIdle).toBe(true)
        expect(result.current.isAlarm).toBe(false)
    })

    it("latches on Alarm and keeps the latch through a later Idle-independent state", () => {
        const { result, rerender } = renderHook(
            ({ state }) => useHmiMachineState({ state }),
            { initialProps: { state: "Idle" } }
        )
        expect(result.current.isLatched).toBe(false)

        rerender({ state: "Alarm" })
        expect(result.current.isAlarm).toBe(true)
        expect(result.current.isLatched).toBe(true)

        // A "Hold" report doesn't clear the latch - only Idle does.
        rerender({ state: "Hold" })
        expect(result.current.isLatched).toBe(true)

        rerender({ state: "Idle" })
        expect(result.current.isLatched).toBe(false)
    })

    it("freezes effectiveState on the last real reading during a \"?\" blip, without affecting isAlarm/isIdle", () => {
        const { result, rerender } = renderHook(
            ({ state }) => useHmiMachineState({ state }),
            { initialProps: { state: "Alarm" } }
        )
        expect(result.current.effectiveState).toBe("Alarm")
        expect(result.current.isLatched).toBe(true)

        rerender({ state: "?" })
        // effectiveState holds onto "Alarm" instead of flickering to "?"...
        expect(result.current.effectiveState).toBe("Alarm")
        // ...but isAlarm/isIdle react to the immediate (unlatched) reading, so
        // a "?" blip reports neither alarm nor idle - and critically, does not
        // clear the isLatched flag the way an explicit Idle would.
        expect(result.current.isAlarm).toBe(false)
        expect(result.current.isIdle).toBe(false)
        expect(result.current.isLatched).toBe(true)
    })
})
