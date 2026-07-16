/*
 SpindleControls.tsx - the spindle panel's status readout: current spindle
 speed (or laser power %, in laser mode).
*/
import { Fragment } from "preact"
import type { FunctionalComponent } from "preact"
import { T } from "../../Translations"
import { useUiContextFn, useSettingsContext } from "../../../contexts"
import { useTargetContext } from "../../../targets"
import { checkDependencies } from "../../Helpers"
import type { DependItem } from "../../Helpers"
import type { ButtonDependItem } from "./spindleState"

const SpindleControls: FunctionalComponent<{ isLaserMode: boolean }> = ({ isLaserMode }) => {
    const { states } = useTargetContext()

    console.log(states)
    const { interfaceSettings, connectionSettings } = useSettingsContext()

    if (!useUiContextFn.getValue("showspindlepanel")) return null
    const states_array: { id: string; label: string; depend?: ButtonDependItem[] }[] = [
        { id: "spindle_speed", label: isLaserMode ? "Power" : "CN64" },
    ]

    return (
        <Fragment>
            {states &&
                (states.spindle_speed ||
                    states.feed_rate ||
                    states.spindle_mode) && (
                    <div class="status-ctrls">
                        {states_array.map((element) => {
                            if (states[element.id]) {
                                if (element.depend) {
                                    if (
                                        !checkDependencies(
                                            // checkDependencies ignores entries with none of id/connection_id/orGroups
                                            // (treats them as always-true), so StatesDependItem entries are harmless here.
                                            element.depend as DependItem[],
                                            interfaceSettings.current.settings,
                                            connectionSettings.current
                                        )
                                    )
                                        return null
                                }
                                const sv = states[element.id]
                                let displayVal = ""

                                if (Array.isArray(sv)) {
                                    displayVal = sv.map((i) => i.value).join(" ")
                                } else {
                                    displayVal = String(sv.value)
                                }

                                if (isLaserMode && element.id === "spindle_speed") {

                                    const sValue = Number(displayVal)

                                    const laserMax =
                                        Number(useUiContextFn.getValue("laser_max_power")) || 255

                                    const percent = Math.round((sValue / laserMax) * 100)

                                    displayVal = `${percent}%`
                                }
                                return (
                                    <div key={element.id}
                                        class="extra-control mt-1 tooltip tooltip-bottom"
                                        data-tooltip={T(element.label)}
                                    >
                                        <div class="extra-control-header">
                                            {T(element.label)}
                                        </div>

                                        <div class="extra-control-value">
                                            {displayVal}
                                        </div>
                                    </div>
                                )
                            }
                        })}
                    </div>
                )}
        </Fragment>
    )
}

export { SpindleControls }
