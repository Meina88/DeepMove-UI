/*
 useLaserMode.ts - detects whether the currently active tool is the
 configured laser tool, and zeroes the shared spindle-speed value the moment
 laser mode engages (the laser power slider starts from 0, not whatever RPM
 value was last set for milling).
*/
import { useEffect } from "preact/hooks"
import { useUiContextFn } from "../../../contexts"
import type { StatesMap } from "../../../targets/types"
import { spindleSpeedValue } from "./spindleState"

export function useLaserMode(states: StatesMap, laser: number | null): {
    isLaserMode: boolean
    laserMaxPower: number
} {
    let currentTool: number | null = null

    if (states?.active_tool) {
        const toolState = states.active_tool

        if (Array.isArray(toolState)) {
            currentTool = Number(toolState[0]?.value)
        } else {
            currentTool = Number(toolState.value)
        }
    }

    const isLaserMode =
        laser != null &&
        currentTool != null &&
        currentTool === laser

    useEffect(() => {
        if (isLaserMode) {
            spindleSpeedValue.current = 0
        }
    }, [isLaserMode])

    const laserMaxPower = Number(useUiContextFn.getValue("laser_max_power")) || 255

    return { isLaserMode, laserMaxPower }
}
