/*
 useHmiResetControl.ts - the HMI footer's reset button: soft-resets the
 controller, and additionally sends an unlock command shortly after when the
 machine is alarmed. resetBusy is a short debounce window (not connected to
 the actual command's completion) purely to give the button a pressed/"is-busy"
 visual state and stop rapid double-taps from queuing the reset twice.
*/
import { useState } from "preact/hooks"
import { useUiContextFn } from "../../../contexts"
import { useTargetCommands } from "../../../hooks"

const SOFT_RESET = "\x18"
const UNLOCK = "$X"
const BUSY_WINDOW_MS = 350
const UNLOCK_DELAY_MS = 120

export function useHmiResetControl(
    isAlarm: boolean,
    targetCommands: ReturnType<typeof useTargetCommands>["targetCommands"]
): {
    resetBusy: boolean
    onResetPress: () => void
} {
    const [resetBusy, setResetBusy] = useState(false)

    const onResetPress = () => {
        if (resetBusy) return

        setResetBusy(true)
        window.setTimeout(() => {
            setResetBusy(false)
        }, BUSY_WINDOW_MS)

        useUiContextFn.haptic([50, 80, 50, 80, 50])

        if (isAlarm) {
            targetCommands(SOFT_RESET)

            window.setTimeout(() => {
                targetCommands(UNLOCK)
            }, UNLOCK_DELAY_MS)

            return
        }

        targetCommands(SOFT_RESET)
    }

    return { resetBusy, onResetPress }
}
