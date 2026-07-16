import { describe, it, expect } from "vitest"
import { computeOverridesDisplay, type OverridesDisplayParams } from "./overridesDisplay"

const baseParams: OverridesDisplayParams = {
    status: {},
    streamStatus: {},
    states: {},
    laser: null,
    rpmMax: 24000,
    feedMax: 5000,
    laserMaxPower: 255,
}

describe("computeOverridesDisplay", () => {
    it("defaults to non-laser mode with zeroed bars when there is no state yet", () => {
        const result = computeOverridesDisplay(baseParams)

        expect(result.isLaserMode).toBe(false)
        expect(result.spindleVal).toBe("--")
        expect(result.feedVal).toBe("--")
        expect(result.spindleBarHeight).toBe(0)
        expect(result.feedBarHeight).toBe(0)
        expect(result.hasRunProgress).toBe(false)
        expect(result.progressPct).toBe(0)
    })

    it("detects laser mode when the active tool matches the configured laser tool number", () => {
        const result = computeOverridesDisplay({
            ...baseParams,
            laser: 2,
            states: { active_tool: { value: 2 } },
        })

        expect(result.isLaserMode).toBe(true)
    })

    it("does not treat a non-matching active tool as laser mode", () => {
        const result = computeOverridesDisplay({
            ...baseParams,
            laser: 2,
            states: { active_tool: { value: 1 } },
        })

        expect(result.isLaserMode).toBe(false)
    })

    it("computes spindle/feed bar heights clamped to their configured max", () => {
        const result = computeOverridesDisplay({
            ...baseParams,
            states: {
                spindle_speed: { value: 12000 },
                feed_rate: { value: 2500 },
            },
        })

        expect(result.spindleVal).toBe(12000)
        expect(result.spindleBarHeight).toBeCloseTo(50, 5)
        expect(result.feedVal).toBe(2500)
        expect(result.feedBarHeight).toBeCloseTo(50, 5)
    })

    it("flags spindle/feed as at-max once a further +10% step would exceed the limit", () => {
        // 24000 rpmMax: a value whose +10% step crosses the ceiling should lock the + button.
        const result = computeOverridesDisplay({
            ...baseParams,
            states: { spindle_speed: { value: 22000 } },
        })

        expect(result.spindleAtMax).toBe(true)
    })

    it("reports run progress as processed/total when a total is present", () => {
        const result = computeOverridesDisplay({
            ...baseParams,
            status: { state: "Run" },
            streamStatus: { processed: 50, total: 200 },
        })

        expect(result.hasRunProgress).toBe(true)
        expect(result.progressPct).toBe(25)
    })

    it("treats processed as an already-computed percentage when there is no total", () => {
        const result = computeOverridesDisplay({
            ...baseParams,
            status: { state: "Hold" },
            streamStatus: { processed: 42 },
        })

        expect(result.hasRunProgress).toBe(true)
        expect(result.progressPct).toBe(42)
    })

    it("floors the visible progress gauge at 1% so it never looks fully empty mid-run", () => {
        const result = computeOverridesDisplay({
            ...baseParams,
            status: { state: "Run" },
            streamStatus: { processed: 0, total: 200 },
        })

        expect(result.progressPct).toBe(0)
        expect(result.progressVisiblePct).toBe(1)
    })

    it("escalates power level from low to mid to high as power draw increases", () => {
        const low = computeOverridesDisplay({ ...baseParams, status: { power: { value: 300 } } })
        const mid = computeOverridesDisplay({ ...baseParams, status: { power: { value: 700 } } })
        const high = computeOverridesDisplay({ ...baseParams, status: { power: { value: 1200 } } })

        expect(low.powerLevel).toBe("low")
        expect(mid.powerLevel).toBe("mid")
        expect(high.powerLevel).toBe("high")
    })

    it("allows resuming from a safety door at substate 0 but not other substates", () => {
        const atZero = computeOverridesDisplay({ ...baseParams, status: { state: "Door", substate: 0 } })
        const atOne = computeOverridesDisplay({ ...baseParams, status: { state: "Door", substate: 1 } })

        expect(atZero.canPlay).toBe(true)
        expect(atOne.canPlay).toBe(false)
    })
})
