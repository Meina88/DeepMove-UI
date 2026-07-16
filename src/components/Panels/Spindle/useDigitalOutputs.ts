/*
 useDigitalOutputs.ts - the D1-D4 digital output toggles: their UI state is
 driven by a "cnc-output" DOM CustomEvent (fired elsewhere when the
 controller reports a pin change), not by the M62/M63 commands this panel
 itself sends - toggleOutput only asks the controller to flip the pin; the
 event is what actually updates the LED.
*/
import { useEffect, useState } from "preact/hooks"
import { useTargetCommands } from "../../../hooks"

export function useDigitalOutputs(
    targetCommands: ReturnType<typeof useTargetCommands>["targetCommands"]
): {
    d1: boolean
    d2: boolean
    d3: boolean
    d4: boolean
    toggleOutput: (pin: number, state: boolean) => void
    resetOutputs: () => void
} {
    const [d1, setD1] = useState(false)
    const [d2, setD2] = useState(false)
    const [d3, setD3] = useState(false)
    const [d4, setD4] = useState(false)

    useEffect(() => {
        const handler = (event: Event) => {
            const customEvent = event as CustomEvent<{ pin: number; state: boolean }>
            const { pin, state } = customEvent.detail

            switch (pin) {
                case 1:
                    setD1(state)
                    break
                case 2:
                    setD2(state)
                    break
                case 3:
                    setD3(state)
                    break
                case 4:
                    setD4(state)
                    break
            }
        }

        window.addEventListener("cnc-output", handler as EventListener)

        return () => {
            window.removeEventListener("cnc-output", handler as EventListener)
        }
    }, [])

    const toggleOutput = (pin: number, state: boolean) => {
        targetCommands(state ? `M63 P${pin}` : `M62 P${pin}`)
    }

    const resetOutputs = () => {
        setD1(false)
        setD2(false)
        setD3(false)
        setD4(false)
    }

    return { d1, d2, d3, d4, toggleOutput, resetOutputs }
}
