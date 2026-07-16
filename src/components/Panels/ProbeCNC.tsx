/*
ProbeCNC.js - ESP3D WebUI component file

 Copyright (c) 2021 Luc LEBOSSE. All rights reserved.

 This code is free software; you can redistribute it and/or
 modify it under the terms of the GNU Lesser General Public
 License as published by the Free Software Foundation; either
 version 2.1 of the License, or (at your option) any later version.
 This code is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 Lesser General Public License for more details.
 You should have received a copy of the GNU Lesser General Public
 License along with This code; if not, write to the Free Software
 Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

import type { FunctionalComponent } from "preact"
import { T } from "../Translations"
import { Diamond } from "../../targets/CNC/FluidNC/icons"
import { useUiContextFn, useSettingsContext } from "../../contexts"
import { ButtonImg, FullScreenButton, CloseButton, ContainerHelper } from "../Controls"
import { useTargetCommands } from "../../hooks"
import { ProbeControls } from "./Probe/ProbeControls"
import { ProbeControlField } from "./Probe/ProbeControlField"
import { buildProbeControls } from "./Probe/probeControlsConfig"
import type { ProbeElementConfig, ProbeFieldElement } from "./Probe/probeState"
import {
    maxprobe,
    probefeedrate,
    probethickness,
    proberetract,
    probetype,
    probeaxis,
} from "./Probe/probeState"

interface ProbePanelProps {
    embedded?: boolean
}

const ProbePanel: FunctionalComponent<ProbePanelProps> = ({ embedded = false }) => {

    const { interfaceSettings, connectionSettings } = useSettingsContext()
    //const { status } = useTargetContext()
    const { targetCommands } = useTargetCommands()
    const id = "ProbePanel"

    if (typeof maxprobe.current === "undefined") {
        maxprobe.current = useUiContextFn.getValue("maxprobe")
    }
    if (typeof probefeedrate.current === "undefined") {
        probefeedrate.current = useUiContextFn.getValue("probefeedrate")
    }
    if (typeof probethickness.current === "undefined") {
        probethickness.current = useUiContextFn.getValue("probethickness")
    }
    if (typeof proberetract.current === "undefined") {
        proberetract.current = useUiContextFn.getValue("proberetract")
    }
    if (typeof probetype.current === "undefined") {
        probetype.current = "G38.2"
    }
    if (typeof probeaxis.current === "undefined") {
        probeaxis.current = "Z"
    }

    const hasError = (): boolean => {
        return !(
            !!probefeedrate.valid &&
            !!probethickness.valid &&
            !!proberetract.valid &&
            !!maxprobe.valid
        )
    }

    const probe_controls = buildProbeControls(targetCommands)

    return (
        <div class="panel panel-dashboard" id={id}>
            <ContainerHelper id={id} />
            {!embedded && (
                <div class="navbar">
                    <span class="navbar-section feather-icon-container">
                        <Diamond />
                        <strong class="text-ellipsis">{T("CN37")}</strong>
                    </span>
                    <span class="navbar-section">
                        <span class="full-height">
                            <FullScreenButton elementId={id} />
                            <CloseButton elementId={id} hideOnFullScreen={true} />
                        </span>
                    </span>
                </div>
            )}

<div class="panel-body panel-body-dashboard">
    {probe_controls.map((block) => {
                    return (
                        <fieldset key={block.id}
                            class={`field-group${block.label.length > 0
                                    ? " fieldset-top-separator fieldset-bottom-separator"
                                    : ""
                                }`}
                        >
                            <legend>
                                {block.label.length > 0 && (
                                    <label class="m-1 buttons-bar-label">
                                        {T(block.label)}
                                    </label>
                                )}
                            </legend>

                            {/* STATUS SECTION INSIDE CARD */}
<ProbeControls />

                            <div class="field-group-content maxwidth text-dark">
                                {block.controls.map((control) => {
                                    return (
                                        <div
  key={control.id}
  class={
    "states-buttons-container" +
    (control.id === "probe_type" ? " probe-top-row" : "")
  }
>

                                            {control.elements.map((element: ProbeElementConfig) => {
                                                if (element.type === "m2") {
                                                    return <div key={element.id} class="m-2" />
                                                } else if (
                                                    element.type === "button"
                                                ) {
                                                    return (
                                                        <ButtonImg key={element.id}
                                                            label={T(
                                                                element.label
                                                            )}
                                                            disabled={hasError()}
                                                            icon={element.icon}
                                                            tooltip
                                                            iconRight={
                                                                element.iconRight
                                                            }
                                                            data-tooltip={T(
                                                                element.tooltip
                                                            )}
                                                            mode={element.mode}
                                                            useinput={
                                                                element.useinput
                                                            }
                                                            onClick={
                                                                element.onclick
                                                            }
                                                        />
                                                    )
                                                } else {
                                                    return (
                                                        <ProbeControlField
                                                            key={element.id}
                                                            element={element as ProbeFieldElement}
                                                            interfaceSettings={interfaceSettings}
                                                            connectionSettings={connectionSettings}
                                                        />
                                                    )
                                                }
                                            })}
                                        </div>
                                    )
                                })}
                            </div>
                        </fieldset>
                    )
                })}
            </div>
        </div>
    )
}

const ProbePanelElement = {
    id: "ProbePanel",
    content: <ProbePanel />,
    name: "CN37",
    icon: "Diamond",
    show: "showprobepanel",
    onstart: "openprobeonstart",
    settingid: "probe",
}

export { ProbePanel, ProbePanelElement, ProbeControls }
