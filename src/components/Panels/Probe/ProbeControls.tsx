/*
 ProbeControls.tsx - the probe panel's status readout: a LED for the probe
 pin's live state and the last probe result (success/fail/none yet).
*/
import { Fragment } from "preact"
import type { FunctionalComponent } from "preact"
import { T } from "../../Translations"
import { useUiContextFn } from "../../../contexts"
import { useTargetContext } from "../../../targets"

const ProbeControls: FunctionalComponent = () => {
    const { gcodeParameters, pinsStates } = useTargetContext()
    if (!useUiContextFn.getValue("showprobepanel")) return null
    return (
        <Fragment>
            <div class="status-ctrls">
                <div
                    class="extra-control mt-1 tooltip tooltip-bottom"
                    data-tooltip={T("CN103")}
                >
                    <div class="extra-control-header probe-status-header">
    <span>{T("CN104")}</span>

    <div
        class={`probe-led ${pinsStates?.P ? "is-active" : ""}`}
    />
</div>

                    <div class="extra-control-value">
                        {gcodeParameters.PRB
                            ? T(gcodeParameters.PRB.success ? "CN101" : "CN102")
                            : T("S300")}
                    </div>
                </div>
            </div>
        </Fragment>
    )
}

export { ProbeControls }
