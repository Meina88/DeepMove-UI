/**
 * InputPins.tsx
 *
 * Componente reutilizable para mostrar el estado de los pines de entrada
 * (Input pins: P, X, Y, Z, V, etc.)
 */

import { FunctionalComponent } from "preact"
import { T } from "../Translations"
import { useTargetContext } from "../../targets"

type PinsStates = Record<string, boolean>

/**
 * Lista fija de pines a mostrar.
 * Ajustala según tu máquina.
 */
const DEFAULT_PINS = ["P", "X", "Y", "Z", "V"]

const InputPins: FunctionalComponent = () => {

    const { pinsStates } = useTargetContext() as {
        pinsStates?: PinsStates
    }

    return (
        <fieldset class="fieldset-top-separator fieldset-bottom-separator field-group">
            <legend>
                <label class="m-1 buttons-bar-label">
                    {T("CN92")}
                </label>
            </legend>

            <div class="field-group-content maxwidth">
                <div class="states-buttons-container">

                    {DEFAULT_PINS.map((pin) => {
                        const active = !!pinsStates?.[pin]

                        return (
                            <div
                                key={pin}
                                class={`badge-container m-1 s-circle ${
                                    active ? "bg-primary" : "bg-secondary"
                                }`}
                            >
                                <div
                                    class={`badge-label m-1 s-circle ${
                                        active
                                            ? "bg-primary text-white"
                                            : "bg-secondary text-primary"
                                    }`}
                                >
                                    {pin}
                                </div>
                            </div>
                        )
                    })}

                </div>
            </div>
        </fieldset>
    )
}

export default InputPins
