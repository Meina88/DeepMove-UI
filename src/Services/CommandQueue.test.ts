import { describe, expect, it, vi } from "vitest"
import { CommandQueue } from "./CommandQueue"
import { Command, CommandState } from "./Commands/Command"

describe("CommandQueue", () => {
    it("starts idle with no current command", () => {
        const queue = new CommandQueue()
        expect(queue.isBusy()).toBe(false)
        expect(queue.current()).toBeUndefined()
    })

    it("routeLine returns undefined and does nothing when the queue is empty", () => {
        const queue = new CommandQueue()
        expect(queue.routeLine("some line")).toBeUndefined()
    })

    it("routes lines to the head command and dequeues it once DONE", () => {
        const queue = new CommandQueue()
        const cmd = new Command("$$")
        queue.enqueue(cmd)

        expect(queue.isBusy()).toBe(true)
        expect(queue.routeLine("$0=10")).toBe(cmd)
        expect(queue.isBusy()).toBe(true) // not DONE yet
        expect(queue.routeLine("ok")).toBe(cmd)
        expect(cmd.state).toBe(CommandState.DONE)
        expect(queue.isBusy()).toBe(false)
    })

    it("keeps routing to the same head until a second command is enqueued", () => {
        const queue = new CommandQueue()
        const first = new Command("$$")
        const second = new Command("$H")
        queue.enqueue(first)
        queue.enqueue(second)

        queue.routeLine("ok")
        expect(first.state).toBe(CommandState.DONE)
        expect(queue.current()).toBe(second)
        expect(second.state).toBe(CommandState.INITIATED)
    })

    it("remove() drops a command out of the queue regardless of position", () => {
        const queue = new CommandQueue()
        const first = new Command("$$")
        const second = new Command("$H")
        queue.enqueue(first)
        queue.enqueue(second)

        queue.remove(first)
        expect(queue.current()).toBe(second)
    })

    it("waitUntilIdle resolves as soon as the queue is empty", async () => {
        vi.useFakeTimers()
        const queue = new CommandQueue()
        const cmd = new Command("$$")
        queue.enqueue(cmd)

        const waiting = queue.waitUntilIdle(10)
        let resolved = false
        waiting.then(() => {
            resolved = true
        })

        await vi.advanceTimersByTimeAsync(10)
        expect(resolved).toBe(false) // still busy

        queue.routeLine("ok") // dequeues cmd
        await vi.advanceTimersByTimeAsync(10)
        expect(resolved).toBe(true)

        vi.useRealTimers()
    })

    it("does NOT occupy a queue slot itself - waitUntilIdle only waits on enqueue()'d commands", async () => {
        // Characterization test for the pre-existing quirk carried over from
        // WebSocketService.write(): calling waitUntilIdle() does not enqueue
        // anything, so it only ever waits on commands already in the queue.
        const queue = new CommandQueue()
        expect(queue.isBusy()).toBe(false)
        await queue.waitUntilIdle(1)
        expect(queue.isBusy()).toBe(false)
    })
})
