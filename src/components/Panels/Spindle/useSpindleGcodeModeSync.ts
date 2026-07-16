/*
 useSpindleGcodeModeSync.ts - re-queries gcode modal state ($G) whenever it's
 likely stale: right after the machine transitions into Idle, and after a
 firmware reset. Also resets the digital-output toggles to a known-safe
 (off) state on reset.

 NOTE: two separate effects below both subscribe to "fw:reset" and both end
 up sending "$G" (one after a 150ms delay, one immediately, which also resets
 the outputs) - preserved exactly as found, not deduplicated here since this
 is a pure structural move, not a behavior change.
*/
import { useEffect, useRef } from "preact/hooks"
import { eventBus } from "../../../hooks/eventBus"
import { useTargetCommands } from "../../../hooks"
import type { Status } from "../../../targets/types"

export function useSpindleGcodeModeSync(
    status: Status,
    targetCommands: ReturnType<typeof useTargetCommands>["targetCommands"],
    resetOutputs: () => void
): void {
    const previousStateRef = useRef<string | undefined>(undefined)

    useEffect(() => {
        const prev = previousStateRef.current
        const current = status?.state

        if (current === "Idle" && prev !== "Idle") {
            setTimeout(() => {
                targetCommands("$G")
            }, 80)
        }

        previousStateRef.current = current
    }, [status?.state, targetCommands])

    useEffect(() => {

        const handler = () => {
            setTimeout(() => {
                targetCommands("$G")
            }, 150)
        }

        const subId = eventBus.on("fw:reset", handler)

        return () => {
            eventBus.off("fw:reset", subId)
        }

        // targetCommands is a fresh, stateless dispatcher every render; depending on it would just
        // resubscribe to the event bus on every render for no behavioral gain.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {

        const handler = () => {

            // refrescar modals
            targetCommands("$G")

            // apagar UI localmente (estado seguro)
            resetOutputs()

        }

        const sub = eventBus.on("fw:reset", handler)

        return () => eventBus.off("fw:reset", sub)

        // targetCommands is a fresh, stateless dispatcher every render; depending on it would just
        // resubscribe to the event bus on every render for no behavioral gain.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
}
