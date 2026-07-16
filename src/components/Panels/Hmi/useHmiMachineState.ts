/*
 useHmiMachineState.ts - derives the HMI header's machine-state display and
 the "latched" alarm indicator from the raw controller status. The controller
 briefly reports state as "?" between polls, so effectiveState holds onto the
 last real (non-"?") value instead of flickering to a placeholder.
*/
import { useRef, useState, useEffect } from "preact/hooks"
import type { Status } from "../../../targets/types"

export function useHmiMachineState(status: Status | undefined): {
    effectiveState: string
    isAlarm: boolean
    isIdle: boolean
    isLatched: boolean
} {
    const lastValidState = useRef<string>("Offline")

    const rawState = status?.state
    if (rawState && rawState !== "?") {
        lastValidState.current = rawState
    }
    const effectiveState = !rawState || rawState === "?" ? lastValidState.current : rawState

    // Deliberately derived from the immediate status, not effectiveState:
    // a "?" blip should NOT keep isAlarm/isIdle latched onto the last real
    // reading the way the header LED's effectiveState does.
    const machineState = status?.state ?? "Idle"
    const normalizedState = String(machineState).toLowerCase()
    const isAlarm = normalizedState.startsWith("alarm")
    const isIdle = normalizedState === "idle"

    const [isLatched, setIsLatched] = useState(false)

    useEffect(() => {
        if (isAlarm) {
            setIsLatched(true)
        }

        if (isIdle) {
            setIsLatched(false)
        }
    }, [isAlarm, isIdle])

    return { effectiveState, isAlarm, isIdle, isLatched }
}
