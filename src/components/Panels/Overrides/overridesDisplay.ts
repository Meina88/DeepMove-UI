/*
 overridesDisplay.ts - pure derivation of everything the Overrides panel
 displays (laser-mode detection, spindle/feed bar heights and max-clamping,
 the power gauge, and the run-progress gauge) from the raw target-context
 status/streamStatus/states. No state, no side effects - safe to unit test
 directly.
*/
import type { Status, StreamStatus, StatesMap } from "../../../targets/types"

export type PowerLevel = "low" | "mid" | "high"

export interface OverridesDisplay {
    isLaserMode: boolean
    canPause: boolean
    canPlay: boolean
    powerW: number
    powerPct: number
    powerLevel: PowerLevel
    spindleVal: string | number
    feedVal: string | number
    spindleAtMax: boolean
    feedAtMax: boolean
    spindleBarHeight: number
    feedBarHeight: number
    hasRunProgress: boolean
    progressPct: number
    progressVisiblePct: number
}

export interface OverridesDisplayParams {
    status: Status
    streamStatus: StreamStatus
    states: StatesMap
    laser: number | null
    rpmMax: number
    feedMax: number
    laserMaxPower: number
}

const MAX_POWER_W = 1500

function valueToHeight(value: number, max: number): number {
    if (value <= 0) return 0
    const clamped = Math.min(value, max)
    return (clamped / max) * 100
}

export function computeOverridesDisplay({
    status,
    streamStatus,
    states,
    laser,
    rpmMax,
    feedMax,
    laserMaxPower,
}: OverridesDisplayParams): OverridesDisplay {
    const activeToolState = states?.active_tool
    const currentTool = activeToolState
        ? Array.isArray(activeToolState)
            ? activeToolState.map((i) => i.value).join(" ")
            : activeToolState.value
        : null

    const isLaserMode =
        laser != null && currentTool != null && Number(currentTool) === Number(laser)
    const spindleMax = isLaserMode ? laserMaxPower : rpmMax

    const canResumeFromDoor = status?.state === "Door" && status?.substate === 0
    const isRun = status?.state === "Run"
    const isHold = status?.state === "Hold"
    const canPause = isRun
    const canPlay = isHold || canResumeFromDoor

    const powerW = status?.power?.value ?? 0
    const powerPct = Math.min((powerW / MAX_POWER_W) * 100, 100)

    let powerLevel: PowerLevel = "low"
    if (powerPct >= 70) {
        powerLevel = "high"
    } else if (powerPct >= 40) {
        powerLevel = "mid"
    }

    const spindle = states?.spindle_speed
    const feed = states?.feed_rate
    const spindleVal: string | number = spindle
        ? Array.isArray(spindle)
            ? spindle.map((i) => i.value).join(" ")
            : spindle.value
        : "--"
    const feedVal: string | number = feed
        ? Array.isArray(feed)
            ? feed.map((i) => i.value).join(" ")
            : feed.value
        : "--"

    const spindleRPM = Number(spindleVal) || 0
    const feedMM = Number(feedVal) || 0

    const spindleNextRPM = spindleRPM * 1.1
    const feedNextMM = feedMM * 1.1

    const spindleAtMax = spindleNextRPM > spindleMax
    const feedAtMax = feedNextMM > feedMax

    const spindleBarHeight = valueToHeight(spindleRPM, spindleMax)
    const feedBarHeight = valueToHeight(feedMM, feedMax)

    const hasRunProgress =
        (status?.state === "Run" || status?.state === "Hold") &&
        streamStatus?.processed !== undefined

    const progressPct = (() => {
        if (!hasRunProgress) return 0

        const processed = Number(streamStatus?.processed ?? 0)

        if (streamStatus?.total) {
            const total = Number(streamStatus.total) || 0
            if (total <= 0) return 0
            return Math.max(0, Math.min(100, Math.round((processed / total) * 100)))
        }

        return Math.max(0, Math.min(100, Math.round(processed)))
    })()

    const progressVisiblePct = Math.max(progressPct, 1)

    return {
        isLaserMode,
        canPause,
        canPlay,
        powerW,
        powerPct,
        powerLevel,
        spindleVal,
        feedVal,
        spindleAtMax,
        feedAtMax,
        spindleBarHeight,
        feedBarHeight,
        hasRunProgress,
        progressPct,
        progressVisiblePct,
    }
}
