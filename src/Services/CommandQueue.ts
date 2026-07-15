import { sleep } from "../utils"
import { Command, CommandState } from "./Commands/Command"

/**
 * Holds the in-flight command queue and routes incoming lines to the command
 * at the head of the queue, dequeuing it once it reaches CommandState.DONE.
 */
export class CommandQueue {
    private commands: Command[] = []

    isBusy(): boolean {
        return this.commands.length > 0
    }

    current(): Command | undefined {
        return this.commands[0]
    }

    enqueue(command: Command): void {
        this.commands.push(command)
    }

    remove(command: Command): void {
        this.commands = this.commands.filter((c) => c !== command)
    }

    /**
     * Feeds a received line to the command at the head of the queue.
     * Returns that command, or undefined if the queue was empty - in which
     * case the caller should treat the line as an unhandled core message.
     */
    routeLine(line: string): Command | undefined {
        const head = this.commands[0]
        if (!head) {
            return undefined
        }

        if (head.debugReceive) {
            console.log(`<<< ${line}`)
        }
        head.appendLine(line)
        if (head.state === CommandState.DONE) {
            this.commands = this.commands.slice(1)
        }
        return head
    }

    /**
     * Waits until the queue drains. Note: this does not itself occupy a
     * queue slot, so two concurrent callers of this method are not mutually
     * exclusive with each other, only with commands enqueued via `enqueue`.
     * Pre-existing behavior (from WebSocketService.write()), preserved as-is.
     */
    async waitUntilIdle(pollMs = 100): Promise<void> {
        while (this.isBusy()) {
            await sleep(pollMs)
        }
    }
}
