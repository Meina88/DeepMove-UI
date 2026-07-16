/*
 MachineSettings.tsx - ESP3D WebUI Target file

 Copyright (c) 2020 Luc Lebosse. All rights reserved.

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
import { Fragment, JSX } from "preact"
import { useEffect, useState } from "preact/hooks"
import { T } from "../../../components/Translations"
import { processor } from "./processor"
import { useTargetCommands } from "../../../hooks"
import { useToastsContext, useUiContext, useUiContextFn } from "../../../contexts"
import { Target } from "./index"
import {
    formatFileSizeToString,
} from "../../../components/Helpers"
import {
    Field,
    Loading,
    ButtonImg,
    CenterLeft,
} from "../../../components/Controls"
import { RefreshCcw, XCircle, Send, Flag } from "preact-feather"
import { CMD } from "./CMD-source"
import type { FeedbackFn } from "./processor"

type MachineSettingElement = {
    type?: string
    value?: string
    initial?: string
    cmd?: string
    hasmodified?: boolean
    haserror?: boolean
}

interface ValidationResult {
    message: JSX.Element | string | null
    valid: boolean
    modified: boolean
}

const machineSettings: { cache: MachineSettingElement[] } = { cache: [] }

const MachineSettingRow = ({
    element,
    index,
    sendCommand,
    generateValidation,
}: {
    element: MachineSettingElement
    index: number
    sendCommand: (element: MachineSettingElement, setvalidation: (v: ValidationResult) => void) => void
    generateValidation: (fieldData: MachineSettingElement) => ValidationResult
}) => {
    const [validation, setvalidation] = useState<ValidationResult>()

    const button = (
        <ButtonImg
            className="submitBtn"
            group
            icon={<Send />}
            label={T("S81")}
            tooltip
            data-tooltip={T("S82")}
            onClick={() => {
                useUiContextFn.haptic()
                sendCommand(element, setvalidation)
            }}
        />
    )

    return (
        <div key={`field-${index}`} class="machine-settings-item">
            <Field
                type={element.type}
                value={element.value}
                // element.type is a plain string (from the EEPROM dump), not a
                // literal, so <Field>'s discriminated union can't narrow to one
                // variant's setValue signature here - same situation as
                // tabs/features/index.tsx's dynamically-typed usage.
                setValue={(val: any, update: boolean = false) => {
                    if (!update) element.value = val
                    setvalidation(generateValidation(element))
                }}
                validation={validation}
                button={button}
            />
        </div>
    )
}

const MachineSettings = () => {
    const [isLoading, setIsLoading] = useState(false)
    const [collected, setCollected] = useState("0 B")
    const { sendSerialCmd } = useTargetCommands()
    const { uisettings } = useUiContext()
    const { toasts } = useToastsContext()

    const processCallBack = (_data: string, total: number) => {
        setCollected(formatFileSizeToString(total))
    }

    const processFeedback: FeedbackFn = (feedback) => {
        if (feedback.status) {
            if (feedback.status == "error") {
                console.log("got error")
                toasts.addToast({
                    content: feedback.content
                        ? `${T("S22")}:${T(String(feedback.content))}`
                        : T("S4"),
                    type: "error",
                })
            } else if (feedback.command == "eeprom") {
                machineSettings.cache = CMD.command("formatEeprom", feedback.content)
            }
        }
        setIsLoading(false)
    }

    const onCancel = (_e?: MouseEvent) => {
        useUiContextFn.haptic()
        toasts.addToast({
            content: T("S175"),
            type: "error",
        })
        processor.stopCatchResponse()
        machineSettings.cache = []
        setIsLoading(false)
    }

    const onRefresh = (e?: MouseEvent) => {
        if (e) useUiContextFn.haptic()
        //get command
        const response = CMD.command("eeprom")
        //send query
        if (
            processor.startCatchResponse(
                "CMD",
                "eeprom",
                processFeedback,
                null,
                processCallBack
            )
        ) {
            setCollected("0 B")
            setIsLoading(true)
            sendSerialCmd(response.cmd, () => { })
        }
    }

    const sendCommand = (element: MachineSettingElement, setvalidation: (v: ValidationResult) => void) => {
        sendSerialCmd(`${element.cmd}=${(element.value || '').trim()}`, () => {
            element.initial = element.value
            setvalidation(generateValidation(element))
        })
        //TODO: Should answer be checked ?
    }

    const generateValidation = (fieldData: MachineSettingElement): ValidationResult => {
        const validation: ValidationResult = {
            message: <Flag style={{ width: "1rem", height: "1rem" }} />,
            valid: true,
            modified: true,
        }
        if (fieldData.type == "text") {
            if (fieldData.value == fieldData.initial) {
                fieldData.hasmodified = false
            } else {
                fieldData.hasmodified = true
            }
            if ((fieldData.value || '').trim().length == 0) validation.valid = false
        }
        if (!validation.valid) {
            validation.message = T("S42")
        }
        fieldData.haserror = !validation.valid
        //setShowSave(checkSaveStatus());
        if (!fieldData.hasmodified && !fieldData.haserror) {
            validation.message = null
            validation.valid = true
            validation.modified = false
        }
        return validation
    }
    useEffect(() => {
        if (uisettings.getValue("autoload") && machineSettings.cache.length === 0) {
            setIsLoading(true)
            //avoid race condition with websocket
            setTimeout(() => {
                onRefresh()
            }, 1000)
        }
        // Mount-only bootstrap: onRefresh/uisettings are recreated every render; adding them here
        // would risk scheduling duplicate refresh timers on every unrelated re-render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div class="container">
            <h4 class="show-low title">{Target}</h4>
            <div class="m-2" />
            <div style={{ textAlign: "center" }}>
                {isLoading && (
                    <Fragment>
                        <Loading class="m-2" />
                        <div>{collected}</div>
                        <ButtonImg
                            donotdisable
                            icon={<XCircle />}
                            label={T("S28")}
                            tooltip
                            data-tooltip={T("S28")}
                            onClick={onCancel}
                        />
                    </Fragment>
                )}
                {!isLoading && (
                    <div class="m-2" style={{ textAlign: "center" }}>
                        {machineSettings.cache.length > 0 && (
                            <div>
                                <CenterLeft bordered>
                                    <div class="machine-settings-grid">
                                        {machineSettings.cache.map((element: MachineSettingElement, index: number) => {
                                            if (element.type == "comment")
                                                return (
                                                    <div key={`comment-${index}`} class="comment m-1">
                                                        {T(element.value)}({element.value})
                                                    </div>
                                                )

                                            return (
                                                <MachineSettingRow
                                                    key={`field-${index}`}
                                                    element={element}
                                                    index={index}
                                                    sendCommand={sendCommand}
                                                    generateValidation={generateValidation}
                                                />
                                            )
                                        })}
                                    </div>
                                </CenterLeft>

                            </div>
                        )}

                        <ButtonImg
                            icon={<RefreshCcw />}
                            label={T("S50")}
                            tooltip
                            data-tooltip={T("S23")}
                            onClick={onRefresh}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}

export { MachineSettings, machineSettings }

