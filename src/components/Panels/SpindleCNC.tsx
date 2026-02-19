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

import { Fragment, TargetedMouseEvent } from "preact"
import type { FunctionalComponent, JSX } from "preact"
import { useState } from "preact/hooks"
import { T } from "../Translations"
import { Zap, Wind, CloudDrizzle, RotateCw, RotateCcw, Octagon } from "preact-feather"
import { Outputs } from "../../targets/CNC/FluidNC/icons"
import {
    useUiContextFn,
    useSettingsContext,
    useToastsContext,
} from "../../contexts"
import { useTargetContext, eventsList } from "../../targets"
import { ButtonImg, Field, FullScreenButton, CloseButton, ContainerHelper } from "../Controls"
import { checkDependencies } from "../Helpers"
import { useTargetCommands } from "../../hooks"

/*
 * Local const
 *
 */

type NumberValue = { current: number }
const spindleSpeedValue = {} as Partial<NumberValue>

/*
 * Callback function when reset is detected
 *
 */ const onReset = (data: any) => {
    console.log("reset Happend:", data)
    //Todo: TBD
}

type StateValue = { value: string } | Array<{ value: string }>
type StatesMap = Record<string, StateValue>

const SpindleControls: FunctionalComponent = () => {
    const { states } = useTargetContext() as { states: StatesMap }
    console.log(states)
    const { interfaceSettings, connectionSettings } = useSettingsContext()
    //Add callback to reset event
    eventsList.on("reset", onReset)
    if (!useUiContextFn.getValue("showspindlepanel")) return null
    const states_array = [
        //{ id: "feed_rate", label: "CN9" },
        { id: "spindle_speed", label: "CN64" },
        { id: "spindle_mode", label: "CN91" },
        {
            id: "coolant_mode",
            label: "CN38",
            depend: [{ id: "showCoolantctrls", value: true }],
        },
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
                                            element.depend,
                                            interfaceSettings.current.settings,
                                            connectionSettings.current
                                        )
                                    )
                                        return null
                                }
                                const sv = states[element.id] as StateValue
                                const displayVal = Array.isArray(sv)
                                    ? sv.map((i) => i.value).join(" ")
                                    : sv.value
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

type ButtonCfg = {
    label?: string
    tooltip?: string
    tooltipclassic?: boolean
    command: string
    icon?: JSX.Element
    iconRight?: boolean
    useinput?: boolean
    mode?: string
    depend?: Array<any>
}
type ButtonsGroup = {
    label: string
    buttons: ButtonCfg[]
    control?: { id: string; type: string; label: string; value: Partial<NumberValue>; min?: number }
    depend?: Array<any>
    tooltipclassic?: boolean
}

const SpindlePanel: FunctionalComponent = () => {
    const { toasts } = useToastsContext()
    const { interfaceSettings, connectionSettings } = useSettingsContext()
    const { status, states, pinsStates } = useTargetContext() as {
        status: { state?: string }
        states: StatesMap
        pinsStates: Record<string, boolean>
    }
    const { targetCommands } = useTargetCommands()
    const id = "SpindlePanel"
    // Digital outputs (estado UI)
    const [d1, setD1] = useState(false)
    const [d2, setD2] = useState(false)
    const [d3, setD3] = useState(false)
    const [d4, setD4] = useState(false)



    if (typeof spindleSpeedValue.current === "undefined") {
        spindleSpeedValue.current = useUiContextFn.getValue("spindlespeed")
    }

    const toggleOutput = (
        pin: number,
        state: boolean,
        setState: (v: boolean) => void
    ) => {
        targetCommands(state ? `M63 P${pin}` : `M62 P${pin}`)
        setState(!state)
    }


    const buttons_list: ButtonsGroup[] = [
        {
            label: "CN201",
            buttons: [
                {
                    icon: <RotateCw />,
                    // label: "M3",
                    tooltip: "CN74",
                    command: "M3 S#",
                    useinput: true,
                    mode: "spindle_mode",
                },
                {
                    icon: <Octagon />,
                    //label: "M5",
                    tooltip: "CN76",
                    command: "M5",
                    mode: "spindle_mode",
                },
                {
                    icon: <RotateCcw />,
                    //label: "M4",
                    tooltip: "CN75",
                    command: "M4 S#",
                    useinput: true,
                    mode: "spindle_mode",
                    depend: [{ id: "showM4ctrls", value: true }],
                },

                // {
                //     label: "M6",
                //     tooltip: "CN109",
                //     command: "M6",
                //     mode: "spindle_mode",
                // },
            ],
            control: {
                id: "spindlespeedInput",
                type: "number",
                label: "CN59",
                value: spindleSpeedValue,
                min: 0,
            },
        },
        // {
        //     label: "CN56",
        //     depend: [{ id: "showCoolantctrls", value: true }],
        //     buttons: [
        //         {
        //             label: "M7",
        //             tooltip: "CN77",
        //             command: "M7",
        //             depend: [{ id: "showM7ctrls", value: true }],
        //             mode: "coolant_mode",
        //         },
        //         {
        //             label: "M8",
        //             tooltip: "CN78",
        //             command: "M8",
        //             mode: "coolant_mode",
        //         },
        //         {
        //             label: "M9",
        //             tooltip: "CN79",
        //             command: "M9",
        //             mode: "coolant_mode",
        //         },
        //     ],
        // },
        {
            label: "CN202",
            buttons: [
                {
                    icon: <Zap />,
                    tooltip: "CN81",
                    command: "#T-SPINDLESTOP#",
                    depend: [{ states: ["Hold"] }],
                },
                {
                    label: "M7",
                    tooltip: "CN83",
                    command: "#T-MISTCOOLANT#",
                    depend: [
                        { states: ["Idle", "Run", "Hold"] },
                        { id: "showCoolantctrls", value: true },
                        { id: "showMistctrls", value: true },
                    ],
                },
                {
                    label: "M8",
                    tooltip: "CN82",
                    tooltipclassic: true,
                    command: "#T-FLOODCOOLANT#",
                    depend: [
                        { states: ["Idle", "Run", "Hold"] },
                        { id: "showCoolantctrls", value: true },
                    ],
                },

            ],
        },
    ]

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

    const inputPinsOrder = ["P", "X", "Y", "Z", "V"]



    return (
        <div class="panel panel-dashboard" id={id}>
            <ContainerHelper id={id} />
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
            <div class="panel-body panel-body-dashboard">
                <SpindleControls />
                {buttons_list.map((item) => {
                    const control = item.control
                    if (item.depend) {
                        if (
                            !checkDependencies(
                                item.depend,
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
                                    button.depend,
                                    interfaceSettings.current.settings,
                                    connectionSettings.current
                                )
                            )
                                return null
                            let index = button.depend.findIndex((element: any) => {
                                return element.states
                            })
                            if (index !== -1) {
                                if (
                                    !button.depend[index].states.includes(
                                        status.state || ""
                                    )
                                )
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
                                    } else targetCommands(button.command)
                                }}
                            />
                        )
                    })

                    if (!(content.filter((item) => item != null).length != 0))
                        return null

                    return (
                        <fieldset key={item.label} class="fieldset-top-separator fieldset-bottom-separator field-group">
                            <legend>
                                <label class="m-1 buttons-bar-label">
                                    {T(item.label)}
                                </label>
                            </legend>
                            <div class="field-group-content maxwidth">
                                <div class="spindle-top-row" />

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
                                        {content}

                                        {/* Tus toggles D1..D4 (van a ocupar col3 fila1 y fila2 completa) */}
                                        <ButtonImg
                                            label="D1"
                                            className="tooltip"
                                            data-tooltip="D1"
                                            onClick={() => toggleOutput(1, d1, setD1)}
                                        />
                                        <ButtonImg
                                            label="D2"
                                            className="tooltip"
                                            data-tooltip="D2"
                                            onClick={() => toggleOutput(2, d2, setD2)}
                                        />
                                        <ButtonImg
                                            label="D3"
                                            className="tooltip"
                                            data-tooltip="D3"
                                            onClick={() => toggleOutput(3, d3, setD3)}
                                        />
                                        <ButtonImg
                                            label="D4"
                                            className="tooltip"
                                            data-tooltip="D4"
                                            onClick={() => toggleOutput(4, d4, setD4)}
                                        />
                                    </div>
                                ) : (
                                    <div class="states-buttons-container">{content}</div>
                                )}


                                <div class="spindle-spacer" />
                                {control && (

                                    <div class="spindle-speed-ctrl">
                                        <input
                                            type="number"
                                            class="spindle-speed-value"
                                            value={control.value.current}
                                            min={control.min}
                                            onInput={(e) => {
                                                const v = Number((e.target as HTMLInputElement).value)
                                                control.value.current = v
                                                setvalidation(generateValidation(v))
                                            }}
                                        />

                                        <div class="spindle-speed-sub-header">RPM</div>
                                    </div>
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