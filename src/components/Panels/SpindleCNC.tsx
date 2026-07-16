/*
SpindleCNC.js - ESP3D WebUI component file

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
import { TargetedMouseEvent } from "preact"
import { useState } from "preact/hooks"
import { T } from "../Translations"
import { Outputs, Flare } from "../../targets/CNC/FluidNC/icons"
import {
    useUiContext,
    useUiContextFn,
    useSettingsContext,
} from "../../contexts"
import { useTargetContext } from "../../targets"
import { ButtonImg, FullScreenButton, CloseButton, ContainerHelper } from "../Controls"
import { checkDependencies } from "../Helpers"
import type { DependItem } from "../Helpers"
import { useTargetCommands } from "../../hooks"
import { SpindleControls } from "./Spindle/SpindleControls"
import { useLaserMode } from "./Spindle/useLaserMode"
import { useLaserTest } from "./Spindle/useLaserTest"
import { useDigitalOutputs } from "./Spindle/useDigitalOutputs"
import { useSpindleGcodeModeSync } from "./Spindle/useSpindleGcodeModeSync"
import { buildSpindleButtonsList } from "./Spindle/spindleButtonsConfig"
import { spindleSpeedValue, isStatesDependItem } from "./Spindle/spindleState"

interface SpindlePanelProps {
    embedded?: boolean
}

const SpindlePanel: FunctionalComponent<SpindlePanelProps> = ({ embedded = false }) => {

    const { interfaceSettings, connectionSettings } = useSettingsContext()
    const { status, states, pinsStates } = useTargetContext()
    const { toolNumbers } = useUiContext()
    const { targetCommands } = useTargetCommands()
    const id = "SpindlePanel"

    const { isLaserMode, laserMaxPower } = useLaserMode(states, toolNumbers?.laser ?? null)
    const { laserTestDuration, setLaserTestDuration, fireLaserTest } = useLaserTest(laserMaxPower, targetCommands)
    const { d1, d2, d3, d4, toggleOutput, resetOutputs } = useDigitalOutputs(targetCommands)
    useSpindleGcodeModeSync(status, targetCommands, resetOutputs)

    if (typeof spindleSpeedValue.current === "undefined") {
        spindleSpeedValue.current = useUiContextFn.getValue("spindlespeed")
    }

    const buttons_list = buildSpindleButtonsList()

    //we won't handle modified state just handle error
    //too many user cases where changing value to show button is not suitable
    const [validation, setvalidation] = useState<{ message: string | null; valid: boolean; modified: boolean }>({
        message: null,
        valid: true,
        modified: false,
    })

    const generateValidation = (value: number) => {
        let validation = {
            message: null,
            valid: true,
            modified: false,
        }
        if (value == 0 || value < 0) {
            //No error message to keep all control aligned
            //may be have a better way ?
            // validation.message = T("S42");
            validation.valid = false
        }

        return validation
    }

    const inputPinsOrder = ["X", "Y", "Z", "P"]

    // Reemplazar por: const inputPinsOrder = ["X", "Y", "Z", "V", "P"] para activar el input de V.

    return (
        <div class="panel panel-dashboard" id={id}>
            <ContainerHelper id={id} />
            {!embedded && (
                <div class="navbar">
                    <span class="navbar-section feather-icon-container">
                        <Outputs />
                        <strong class="text-ellipsis">{T("CN36")}</strong>
                    </span>
                    <span class="navbar-section">
                        <span class="full-height">
                            <FullScreenButton
                                elementId={id}
                            />
                            <CloseButton
                                elementId={id}
                                hideOnFullScreen={true}
                            />
                        </span>
                    </span>
                </div>
            )}
            <div class="panel-body panel-body-dashboard">
                {buttons_list.map((item) => {
                    const control = item.control
                    // Ocultar Digital Outputs si la máquina no está Idle
                    if (item.label === "CN202" && status.state !== "Idle") {
                        return null
                    }
                    if (item.depend) {
                        if (
                            !checkDependencies(
                                item.depend as DependItem[],
                                interfaceSettings.current.settings,
                                connectionSettings.current
                            )
                        )
                            return null
                    }
                    const content = item.buttons.map((button, index) => {



                        if (button.depend) {
                            if (
                                !checkDependencies(
                                    button.depend as DependItem[],
                                    interfaceSettings.current.settings,
                                    connectionSettings.current
                                )
                            )
                                return null
                            const stateDepend = button.depend.find(isStatesDependItem)
                            if (stateDepend) {
                                if (!stateDepend.states.includes(status.state || ""))
                                    return null
                            }
                        }
                        let classname = "tooltip"

                        if (!item.tooltipclassic) {
                            if (item.buttons.length / 2 > index) {
                                classname += " tooltip-right"
                            } else {
                                classname += " tooltip-left"
                            }
                        }
                        if (states && button.mode && states[button.mode]) {
                            const modeVal = states[button.mode]
                            if (Array.isArray(modeVal)) {
                                if (modeVal.some(item => item.value == button.label)) {
                                    classname += " btn-primary"
                                }
                            } else {
                                if ((modeVal as { value: string }).value == button.label) {
                                    classname += " btn-primary"
                                }
                            }
                        }
                        return (
                            <ButtonImg key={button.label}
                                disabled={
                                    button.useinput ? !validation.valid : false
                                }
                                label={T(button.label)}
                                icon={button.icon}
                                className={classname}
                                iconRight={button.iconRight}
                                data-tooltip={T(button.tooltip)}
                                onClick={(e: TargetedMouseEvent<HTMLButtonElement>) => {
                                    useUiContextFn.haptic()
                                    e.currentTarget.blur()

                                    if (button.useinput) {
                                        targetCommands(
                                            button.command.replace(
                                                "S#",
                                                `S${spindleSpeedValue.current}`
                                            )
                                        )
                                        return
                                    }

                                    targetCommands(button.command)

                                    if (button.label === "M7" || button.label === "M8") {
                                        targetCommands("$G")
                                    }
                                }}
                            />
                        )
                    })

                    if (
                        item.label !== "CN202" &&
                        !(content.filter((item) => item != null).length != 0)
                    )
                        return null

                    return (
                        <fieldset key={item.label} class="fieldset-top-separator fieldset-bottom-separator field-group">
                            <legend>
                                <label class="m-1 buttons-bar-label">
                                    {isLaserMode && item.label === "CN201"
                                        ? "Laser"
                                        : T(item.label)}
                                </label>
                            </legend>
                            <div class="field-group-content maxwidth">
                                <div class="spindle-top-row" />
                                {item.label === "CN201" && (
                                    <div class="spindle-status-block">
                                        <SpindleControls isLaserMode={isLaserMode} />
                                    </div>
                                )}

                                {isLaserMode && item.label === "CN201" && (
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "12px" }}>

                                        <ButtonImg
                                            icon={<Flare height="1.2em" />}
                                            className="tooltip"
                                            data-tooltip="Laser Test Fire"
                                            onClick={() => {
                                                fireLaserTest()
                                            }}
                                        />

                                        <div style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "10px",
                                            marginTop: "10px"
                                        }}>

                                            <input
                                                type="range"
                                                class="laser-test-slider"
                                                min="0"
                                                max="5"
                                                step="0.1"
                                                value={laserTestDuration}
                                                onInput={(e) =>
                                                    setLaserTestDuration(Number((e.target as HTMLInputElement).value))
                                                }
                                            />

                                            <div style={{ fontSize: "12px", minWidth: "40px" }}>
                                                {laserTestDuration.toFixed(1)} s
                                            </div>

                                        </div>

                                    </div>
                                )}

                                {item.label === "CN202" && !item.control ? (

                                    <div
                                        class="states-buttons-container"
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "repeat(3, 1fr)",
                                            gap: "14px",
                                            justifyItems: "center",
                                        }}
                                    >
                                        {/* Botones existentes de CN80 (Wind / CloudDrizzle / etc) */}
                                        {content.filter(Boolean)}

                                        {/* Tus toggles D1..D4 (van a ocupar col3 fila1 y fila2 completa) */}
                                        <ButtonImg
                                            label="D1"
                                            className={`tooltip ${d1 ? "btn-primary" : ""}`}
                                            data-tooltip="D1"
                                            onClick={(e: TargetedMouseEvent<HTMLButtonElement>) => {
                                                useUiContextFn.haptic()
                                                e.currentTarget.blur()
                                                toggleOutput(1, d1)
                                            }}
                                        />

                                        <ButtonImg
                                            label="D2"
                                            className={`tooltip ${d2 ? "btn-primary" : ""}`}
                                            data-tooltip="D2"
                                            onClick={(e: TargetedMouseEvent<HTMLButtonElement>) => {
                                                useUiContextFn.haptic()
                                                e.currentTarget.blur()
                                                toggleOutput(2, d2)
                                            }}
                                        />

                                        <ButtonImg
                                            label="D3"
                                            className={`tooltip ${d3 ? "btn-primary" : ""}`}
                                            data-tooltip="D3"
                                            onClick={(e: TargetedMouseEvent<HTMLButtonElement>) => {
                                                useUiContextFn.haptic()
                                                e.currentTarget.blur()
                                                toggleOutput(3, d3)
                                            }}
                                        />

                                        <ButtonImg
                                            label="D4"
                                            className={`tooltip ${d4 ? "btn-primary" : ""}`}
                                            data-tooltip="D4"
                                            onClick={(e: TargetedMouseEvent<HTMLButtonElement>) => {
                                                useUiContextFn.haptic()
                                                e.currentTarget.blur()
                                                toggleOutput(4, d4)
                                            }}
                                        />
                                    </div>
                                ) : (
                                    !(isLaserMode && item.label === "CN201") && (
                                        <div class="states-buttons-container">{content}</div>
                                    )
                                )}


                                <div class="spindle-spacer" />
                                {control && (
                                    isLaserMode ? (

                                        <div style={{
                                            display: "flex",
                                            justifyContent: "center",
                                            marginTop: "10px"
                                        }}>

                                            <div style={{
                                                display: "flex",
                                                justifyContent: "center",
                                                marginTop: "10px"
                                            }}>
                                                <div style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "10px",
                                                    width: "200px"
                                                }}>

                                                    <input
                                                        type="range"
                                                        class="laser-power-slider"
                                                        min="0"
                                                        max="100"
                                                        step="1"
                                                        value={control.value.current}
                                                        onInput={(e) => {

                                                            const v = Number((e.target as HTMLInputElement).value)

                                                            control.value.current = v

                                                            setvalidation(generateValidation(v))

                                                        }}
                                                    />

                                                    <div style={{
                                                        fontSize: "12px",
                                                        minWidth: "36px",
                                                        textAlign: "right"
                                                    }}>
                                                        {control.value.current} %
                                                    </div>

                                                </div>
                                            </div>
                                        </div>

                                    ) : (

                                        <div class="spindle-speed-ctrl">

                                            <input
                                                type="number"
                                                class="spindle-speed-value"
                                                value={control.value.current}
                                                min={0}
                                                onInput={(e) => {

                                                    const v = Number((e.target as HTMLInputElement).value)

                                                    control.value.current = v

                                                    setvalidation(generateValidation(v))

                                                }}
                                            />

                                            <div class="spindle-speed-sub-header">
                                                RPM
                                            </div>

                                        </div>

                                    )
                                )}

                            </div>

                        </fieldset>



                    )

                })}
                {/* =======================
    INPUT PINS SECTION
======================= */}
                <fieldset class="fieldset-top-separator fieldset-bottom-separator field-group">
                    <legend>
                        <label class="m-1 buttons-bar-label">
                            {T("CN92")}
                        </label>
                    </legend>

                    <div class="field-group-content maxwidth">
                        <div class="input-pins-container">
                            {inputPinsOrder.map((pin) => {
                                const isActive = !!pinsStates?.[pin]

                                return (
                                    <div key={pin} class="input-pin-wrapper">
                                        <div
                                            class={`input-pin-led ${isActive ? "is-active" : ""}`}
                                        />
                                        <div class="input-pin-label">{pin}</div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </fieldset>


            </div>
        </div>
    )
}

const SpindlePanelElement = {
    id: "SpindlePanel",
    content: <SpindlePanel />,
    name: "CN36",
    icon: "Outputs",
    show: "showspindlepanel",
    onstart: "openspindleonstart",
    settingid: "spindle",
}

export { SpindlePanel, SpindlePanelElement, SpindleControls }
