export type ScheduleRetryResult =
    | { kind: "skipped-manual" }
    | { kind: "exhausted"; maxAttempts: number }
    | { kind: "scheduled"; attempt: number; maxAttempts: number }

/**
 * Tracks reconnection attempt counting, backoff timing, and the
 * manual-disconnect flag that stops auto-reconnection from kicking back in.
 * This is pure bookkeeping - WebSocketService is still the one deciding what
 * a scheduled/exhausted attempt actually does (toasts, cleanup, calling
 * connect()).
 */
export class ReconnectionManager {
    private attempts = 0
    private maxAttempts: number
    private baseDelayMs: number
    private timeoutId: NodeJS.Timeout | undefined
    private manualDisconnect = false

    constructor(options?: { maxAttempts?: number; baseDelayMs?: number }) {
        this.maxAttempts = options?.maxAttempts ?? 4
        this.baseDelayMs = options?.baseDelayMs ?? 2000
    }

    setConfig(options: { maxAttempts?: number; baseDelayMs?: number }): void {
        if (options.maxAttempts !== undefined) {
            this.maxAttempts = options.maxAttempts
        }
        if (options.baseDelayMs !== undefined) {
            this.baseDelayMs = options.baseDelayMs
        }
    }

    getAttempts(): number {
        return this.attempts
    }

    isPending(): boolean {
        return this.timeoutId !== undefined
    }

    setManualDisconnect(manual: boolean): void {
        this.manualDisconnect = manual
    }

    isManualDisconnect(): boolean {
        return this.manualDisconnect
    }

    resetAttempts(): void {
        this.attempts = 0
    }

    /**
     * Increments the attempt counter without scheduling anything.
     * WebSocketService's WebSocket-error handler bumps this directly before
     * also calling scheduleRetry() below - so a single WebSocket error
     * currently counts as two attempts. That is pre-existing behavior,
     * preserved here rather than silently fixed.
     */
    bumpAttempts(): void {
        this.attempts++
    }

    cancel(): void {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId)
            this.timeoutId = undefined
        }
    }

    /**
     * Decides whether a reconnection attempt should be scheduled, and if so,
     * schedules `onRetry` after the backoff delay and increments the attempt
     * counter. Returns which of the three outcomes happened so the caller can
     * show the appropriate toast/cleanup.
     */
    scheduleRetry(onRetry: () => void): ScheduleRetryResult {
        if (this.manualDisconnect) {
            return { kind: "skipped-manual" }
        }

        if (this.attempts >= this.maxAttempts) {
            return { kind: "exhausted", maxAttempts: this.maxAttempts }
        }

        this.attempts++
        this.cancel()
        this.timeoutId = setTimeout(onRetry, this.baseDelayMs)
        return { kind: "scheduled", attempt: this.attempts, maxAttempts: this.maxAttempts }
    }
}
