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
    private stableMs: number
    private timeoutId: NodeJS.Timeout | undefined
    private stableTimeoutId: NodeJS.Timeout | undefined
    private manualDisconnect = false

    constructor(options?: { maxAttempts?: number; baseDelayMs?: number; stableMs?: number }) {
        this.maxAttempts = options?.maxAttempts ?? 4
        this.baseDelayMs = options?.baseDelayMs ?? 2000
        this.stableMs = options?.stableMs ?? 15000
    }

    setConfig(options: { maxAttempts?: number; baseDelayMs?: number; stableMs?: number }): void {
        if (options.maxAttempts !== undefined) {
            this.maxAttempts = options.maxAttempts
        }
        if (options.baseDelayMs !== undefined) {
            this.baseDelayMs = options.baseDelayMs
        }
        if (options.stableMs !== undefined) {
            this.stableMs = options.stableMs
        }
    }

    getAttempts(): number {
        return this.attempts
    }

    /** True while a retry has been scheduled and has not fired yet */
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
     * Call once a connection has been established. The attempt counter is not
     * cleared right away but only after the connection has stayed up for
     * `stableMs`: a link that is established and immediately lost again (for
     * example two pages of the same browser session taking the socket from
     * each other, which the controller does by closing the older one) must
     * keep counting, or the two would reconnect forever.
     */
    noteConnected(): void {
        this.clearStableTimer()
        this.stableTimeoutId = setTimeout(() => {
            this.stableTimeoutId = undefined
            this.attempts = 0
        }, this.stableMs)
    }

    cancel(): void {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId)
            this.timeoutId = undefined
        }
        this.clearStableTimer()
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
        this.timeoutId = setTimeout(() => {
            this.timeoutId = undefined
            onRetry()
        }, this.baseDelayMs)
        return { kind: "scheduled", attempt: this.attempts, maxAttempts: this.maxAttempts }
    }

    private clearStableTimer(): void {
        if (this.stableTimeoutId) {
            clearTimeout(this.stableTimeoutId)
            this.stableTimeoutId = undefined
        }
    }
}
