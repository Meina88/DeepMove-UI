/*
 useOverrideCommands.ts - owns the spindle/feed override UI percentages and
 sends the matching #SSO#/#FO# realtime commands. When linked, a delta is
 applied to (and a command sent for) both spindle and feed together.
*/
import { useState } from "preact/hooks"
import { useTargetCommands } from "../../../hooks"

export type OverrideType = "spindle" | "feed"
export type OverrideDelta = "+10" | "-10" | "100"

export function useOverrideCommands(
    linked: boolean,
    targetCommands: ReturnType<typeof useTargetCommands>["targetCommands"]
): {
    uiSpindleOverride: number
    uiFeedOverride: number
    sendOverride: (type: OverrideType, delta: OverrideDelta) => void
} {
    const [uiSpindleOverride, setUiSpindleOverride] = useState(100)
    const [uiFeedOverride, setUiFeedOverride] = useState(100)

    const applyDelta = (current: number, delta: OverrideDelta) => {
        if (delta === "100") return 100
        if (delta === "+10") return Math.min(150, current + 10)
        if (delta === "-10") return Math.max(50, current - 10)
        return current
    }

    const sendOverride = (type: OverrideType, delta: OverrideDelta) => {
        if (!linked) {
            if (type === "spindle") {
                setUiSpindleOverride((v) => applyDelta(v, delta))
                targetCommands(`#SSO${delta}#`)
            } else {
                setUiFeedOverride((v) => applyDelta(v, delta))
                targetCommands(`#FO${delta}#`)
            }
            return
        }

        // linked
        setUiSpindleOverride((v) => applyDelta(v, delta))
        setUiFeedOverride((v) => applyDelta(v, delta))
        targetCommands(`#SSO${delta}#`)
        targetCommands(`#FO${delta}#`)
    }

    return { uiSpindleOverride, uiFeedOverride, sendOverride }
}
