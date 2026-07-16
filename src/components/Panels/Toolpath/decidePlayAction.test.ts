import { describe, it, expect } from "vitest"
import { decidePlayAction } from "./decidePlayAction"

describe("decidePlayAction", () => {
    it("shows pause while the machine is running", () => {
        const result = decidePlayAction({ state: "Run" }, false)
        expect(result.action).toBe("pause")
        expect(result.canPause).toBe(true)
        expect(result.canPlay).toBe(false)
    })

    it("allows resume when held", () => {
        const result = decidePlayAction({ state: "Hold" }, false)
        expect(result.action).toBe("resume")
        expect(result.canResume).toBe(true)
        expect(result.canPlay).toBe(true)
    })

    it("allows resume when at a safety door with substate 0, but does not count as isHold", () => {
        const result = decidePlayAction({ state: "Door", substate: 0 }, false)
        expect(result.action).toBe("resume")
        expect(result.canResume).toBe(true)
        expect(result.isHold).toBe(false)
    })

    it("marks isHold only for an actual Hold state, not the broader canResume", () => {
        const result = decidePlayAction({ state: "Hold" }, false)
        expect(result.isHold).toBe(true)
    })

    it("does not allow resume at a safety door with a non-zero substate", () => {
        const result = decidePlayAction({ state: "Door", substate: 1 }, false)
        expect(result.canResume).toBe(false)
        expect(result.action).toBe("none")
    })

    it("allows running the selected file when idle with a file selected", () => {
        const result = decidePlayAction({ state: "Idle" }, true)
        expect(result.action).toBe("run-file")
        expect(result.canRunFile).toBe(true)
        expect(result.canPlay).toBe(true)
    })

    it("does not allow running a file when idle without a file selected", () => {
        const result = decidePlayAction({ state: "Idle" }, false)
        expect(result.canRunFile).toBe(false)
        expect(result.action).toBe("none")
        expect(result.canPlay).toBe(false)
    })

    it("prefers pause over resume/run-file when somehow all could apply", () => {
        const result = decidePlayAction({ state: "Run" }, true)
        expect(result.action).toBe("pause")
    })

    it("treats an undefined status as no machine state (nothing playable)", () => {
        const result = decidePlayAction(undefined, true)
        expect(result.action).toBe("none")
        expect(result.canPlay).toBe(false)
    })
})
