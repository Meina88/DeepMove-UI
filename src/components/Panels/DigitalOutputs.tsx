/**
 * DigitalOutputs.tsx
 *
 * Filosofía:
 * - NO se usa M9
 * - Flood (M8) es toggle UI
 * - Las salidas digitales son independientes
 * - La UI representa la intención del operador
 *
 * Mapeo:
 * D1 -> Flood coolant (M8)
 * D2 -> Digital output 1  (M62 P1 / M63 P1)
 * D3 -> Digital output 2  (M62 P2 / M63 P2)
 * D4 -> Digital output 3  (M62 P3 / M63 P3)
 * D5 -> Digital output 4  (M62 P4 / M63 P4)
 * D6 -> Digital output 5  (M62 P5 / M63 P5)
 */

import { FunctionalComponent } from "preact"
import { useState } from "preact/hooks"
import { useEffect } from "preact/hooks"
import { useTargetCommands } from "../../hooks"
import { useUiContextFn } from "../../contexts"
import { Wind } from "preact-feather"
import type { JSX } from "preact"

type OutputId = 1 | 2 | 3 | 4 | 5 | 6

type OutputDef = {
    id: OutputId
    label: string
    icon?: JSX.Element
}

const OUTPUTS: OutputDef[] = [
    { id: 1, label: "M8" },
    { id: 2, label: "D2" },
    { id: 3, label: "D3" },
    { id: 4, label: "D4" },
    { id: 5, label: "D5" },
    { id: 6, label: "D6" },
]

const DigitalOutputs: FunctionalComponent<{ resetKey: number }> = ({ resetKey }) => {

    const { targetCommands } = useTargetCommands()

    /**
     * Estado local de la UI (única fuente de verdad)
     */
    const [uiStates, setUiStates] = useState<Record<OutputId, boolean>>({
        1: false,
        2: false,
        3: false,
        4: false,
        5: false,
        6: false,
    })

    useEffect(() => {
    setUiStates({
        1: false,
        2: false,
        3: false,
        4: false,
        5: false,
        6: false,
    })
}, [resetKey])

    const toggle = (id: OutputId) => {
        useUiContextFn.haptic()

        setUiStates((prev) => {
            const next = !prev[id]

            // 🔹 D1 → Flood (M8)
            if (id === 1) {
                targetCommands("#T-FLOODCOOLANT#")
            }
            // 🔹 D2..D6 → salidas digitales
            if (id >= 2 && id <= 6) {
                const pin = id - 1
                targetCommands(next ? `M62 P${pin}` : `M63 P${pin}`)
            }

            return {
                ...prev,
                [id]: next,
            }
        })
    }

    return (
        <fieldset class="fieldset-top-separator fieldset-bottom-separator field-group">
            <legend>
                <label class="m-1 buttons-bar-label">
                    Digital outputs
                </label>
            </legend>

            <div class="field-group-content maxwidth">
                <div
                    class="states-buttons-container"
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "14px",
                        justifyItems: "center",
                    }}
                >
                    {OUTPUTS.map((out) => {
                        const active = uiStates[out.id]

                        return (
                            <button
                                key={out.id}
                                class={`btn ${
                                    active ? "btn-primary" : "btn-outline"
                                }`}
                                style={{
                                    width: "72px",
                                    height: "56px",
                                    fontWeight: "600",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "4px",
                                }}
                                onClick={() => toggle(out.id)}
                            >
                                {out.icon && <span>{out.icon}</span>}
                                <span>{out.label}</span>
                            </button>
                        )
                    })}
                </div>
            </div>
        </fieldset>
    )
}

export default DigitalOutputs
