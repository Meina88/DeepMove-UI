import { describe, expect, it, vi } from "vitest"
import { Command, CommandState } from "./Command"

describe("Command", () => {
    it("starts in the INITIATED state with an empty response", () => {
        const cmd = new Command("$H")
        expect(cmd.state).toBe(CommandState.INITIATED)
        expect(cmd.response).toEqual([])
        expect(cmd.getCommand()).toBe("$H")
    })

    it("accumulates every appended line in order", () => {
        const cmd = new Command("$$")
        cmd.appendLine("$0=10")
        cmd.appendLine("$1=25")
        expect(cmd.response).toEqual(["$0=10", "$1=25"])
        expect(cmd.state).toBe(CommandState.INITIATED)
    })

    it("transitions to DONE and calls onDone when a line starts with 'ok'", () => {
        const cmd = new Command("$$")
        const onDone = vi.fn().mockResolvedValue(undefined)
        cmd.onDone = onDone
        cmd.appendLine("$0=10")
        cmd.appendLine("ok")
        expect(cmd.state).toBe(CommandState.DONE)
        expect(onDone).toHaveBeenCalledTimes(1)
    })

    it("transitions to DONE and calls onDone when a line starts with 'error'", () => {
        const cmd = new Command("$X")
        const onDone = vi.fn().mockResolvedValue(undefined)
        cmd.onDone = onDone
        cmd.appendLine("error:9")
        expect(cmd.state).toBe(CommandState.DONE)
        expect(onDone).toHaveBeenCalledTimes(1)
    })

    it("calls onDone again on every subsequent ok/error line (no DONE guard today)", () => {
        // Characterization test: appendLine does not check `this.state` before
        // firing onDone, so a second "ok" after DONE fires onDone a second time.
        const cmd = new Command("$$")
        const onDone = vi.fn().mockResolvedValue(undefined)
        cmd.onDone = onDone
        cmd.appendLine("ok")
        cmd.appendLine("ok")
        expect(onDone).toHaveBeenCalledTimes(2)
    })

    // CommandState.SENT and CommandState.TIMED_OUT are declared but never
    // assigned anywhere in the current codebase (verified by grep) - this test
    // only pins the states that are actually reachable today.
})
