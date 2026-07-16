/*
 modalFieldsBridge.tsx - handles the "modal" message type of the extension
 postMessage IPC protocol (dynamic field-form modals requested by iframe
 extensions). Split out of areas/index.tsx's processExtensionMessage.

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
import { Fragment, render, TargetedEvent } from "preact"
import { iconsFeather } from "../components/Images"
import {
    generateValidationGlobal as generateValidation,
    exportPreferences,
    exportPreferencesSection,
    importPreferencesSection,
} from "../tabs/interface"
import { Field, FieldGroup } from "../components/Controls"
import { showModal } from "../components/Modal"
import { dispatchToExtensions, sanitizeHtml } from "../components/Helpers"
import { T } from "../components/Translations"
import { HelpCircle, Layout } from "preact-feather"
import type { ModalManager } from "../types/modals.types"

export function handleModalMessage(eventMsg: any, modals: ModalManager): void {
    let inputData: any = null
    const validationBtn: any = {}
    const content = eventMsg.data.content
    const hasError = () => {
        if (content.style == "fields") {
            const stmp = JSON.stringify(content.fields)
            if (
                stmp.includes('haserror":true') ||
                stmp.includes("haserror':true")
            ) {
                return true
            }
        }
        return false
    }

    const exportResult = () => {
        const settingsValues: any = {}
        if (content.style == "fields") {
            settingsValues.values = inputData
            settingsValues.export = exportPreferencesSection(
                settingsValues,
                false
            )
        } else {
            settingsValues.export = inputData
        }

        return settingsValues.export
    }
    const cb1 = () => {
        if (
            (content.style == "fields" ||
                content.style == "input") &&
            content.validation == "bt1"
        ) {
            if (hasError()) {
                return
            }
            modals.removeModal(modals.getModalIndex(content.id))
        }

        setTimeout(() => {
            dispatchToExtensions(
                "modal",
                {
                    response: content.response1,
                    inputData:
                        content.validation == "bt1"
                            ? exportResult()
                            : "",
                    initiator: eventMsg.data,
                },
                eventMsg.data.id
            )
        }, 500)
    }
    const cb2 = () => {
        if (
            (content.style == "fields" ||
                content.style == "input") &&
            content.validation == "bt2"
        ) {
            if (hasError()) {
                return
            }
            modals.removeModal(modals.getModalIndex(content.id))
        }

        setTimeout(() => {
            dispatchToExtensions(
                "modal",
                {
                    response: content.response2,
                    inputData:
                        content.validation == "bt2"
                            ? exportPreferences(
                                exportResult(),
                                false
                            )
                            : "",
                    initiator: eventMsg.data,
                },
                eventMsg.data.id
            )
        }, 500)
    }
    if (content.style == "fields") {
        if (content.validation == "bt1") {
            validationBtn.id = content.bt1Id
                ? content.bt1Id
                : "bt1"
        }
        if (content.validation == "bt2") {
            validationBtn.id = content.bt2Id
                ? content.bt2Id
                : "bt2"
        }
    }
    if (content.style == "input") {
        inputData = content.value
    }
    const modalContent: any = {}
    if (content.style == "fields") {
        //merge format and fields

        const result = importPreferencesSection(
            content.fields,
            content.values
        )
        inputData = result.preferences

        //This function is a replacement of the hook feature which is not available in this context
        const checkValidation = (fieldData: any) => {
            const id_group = `group-${fieldData.id}`
            if (typeof fieldData.initial == "undefined") {
                fieldData.initial = fieldData.value
            }
            const validation = generateValidation(fieldData)
            const element = document.getElementById(id_group)
            if (!element) return
            const divToRemove =
                element.getElementsByClassName(
                    "form-input-hint"
                )
            if (divToRemove.length > 0) {
                element.removeChild(divToRemove[0])
            }
            if (validation.modified && validation.valid) {
                element.classList.add("has-modification")
                const newDiv = document.createElement("div")
                render(validation.message, newDiv)
                newDiv.classList.add(
                    "form-input-hint",
                    "text-center"
                )
                element.appendChild(newDiv)
            } else {
                const groupElement = document.getElementById(id_group)
                if (groupElement) {
                    groupElement.classList.remove("has-modification")
                }
            }
            if (!validation.valid) {
                const groupElement = document.getElementById(id_group)
                if (groupElement) {
                    groupElement.classList.add("has-error")
                }
                const newDiv = document.createElement("div")
                newDiv.innerHTML = T(validation.message)
                newDiv.classList.add(
                    "form-input-hint",
                    "text-center"
                )

                element.appendChild(newDiv)
            } else {
                const groupElement = document.getElementById(id_group)
                if (groupElement) {
                    groupElement.classList.remove("has-error")
                }
            }

            const validationBtnElement = document.getElementById(validationBtn.id)
            if (validationBtnElement) {
                if (hasError()) {
                    validationBtnElement.style.visibility = "hidden"
                } else {
                    validationBtnElement.style.visibility = "visible"
                }
            }
        }
        const renderFields = () => {
            const section = inputData
            return Object.keys(section).map((subsectionId) => {
                const fieldData = section[subsectionId]
                //console.log(fieldData)
                if (fieldData.type == "group") {
                    return (
                        <FieldGroup
                            key={subsectionId}
                            id={fieldData.id}
                            label={T(fieldData.label)}
                        >
                            {Object.keys(fieldData.value).map(
                                (subData) => {
                                    const subFieldData =
                                        fieldData.value[subData]
                                    const {
                                        label: _label,
                                        initial: _initial,
                                        type: _type,
                                        ...rest
                                    } = subFieldData
                                    return (
                                        <Field key={subData}
                                            label={T(
                                                subFieldData.label
                                            )}
                                            value={
                                                subFieldData.value
                                            }
                                            type={
                                                subFieldData.type
                                            }
                                            setValue={(
                                                val: any,
                                                update = false
                                            ) => {
                                                if (!update) {
                                                    subFieldData.value =
                                                        val
                                                }
                                                checkValidation(
                                                    subFieldData
                                                )
                                            }}
                                            {...rest}
                                        />
                                    )
                                }
                            )}
                        </FieldGroup>
                    )
                } else {
                    const { label, initial: _initial, type, ...rest } =
                        fieldData
                    return (
                        <Field
                            key={subsectionId}
                            label={T(label)}
                            type={type}
                            inline={
                                type == "boolean" ||
                                    type == "icon"
                                    ? true
                                    : false
                            }
                            {...rest}
                            setValue={(val: any, update = false) => {
                                if (!update) {
                                    fieldData.value = val
                                }
                                checkValidation(fieldData)
                            }}
                        />
                    )
                }
            })
        }

        modalContent.content = renderFields()
    } else {
        modalContent.content = T(content.text)
    }
    let modal_content = modalContent.content
    if (content.style != "fields") {
        modal_content = (<div dangerouslySetInnerHTML={{ __html: sanitizeHtml(modalContent.content) }}></div>)
    }
    showModal({
        modals,
        title: T(content.title),
        button2: content.bt2Txt
            ? {
                cb: cb2,
                text: T(content.bt2Txt),
                id: "bt2",
                noclose:
                    content.validation == "bt2"
                        ? true
                        : false,
            }
            : undefined,
        button1: content.bt1Txt
            ? {
                cb: cb1,
                text: T(content.bt1Txt),
                id: "bt1",
                noclose:
                    content.validation == "bt1"
                        ? true
                        : false,
            }
            : undefined,
        icon:
            content.icon ? iconsFeather[content.icon as keyof typeof iconsFeather] : content.style == "question" ? (
                <HelpCircle />
            ) : (
                <Layout />
            ),
        id: content.id,
        content: (
            <Fragment>
                {modal_content}
                {content.style == "input" && (
                    <input
                        class="form-input"
                        onInput={(e: TargetedEvent<HTMLInputElement, Event>) => {
                            inputData = e.currentTarget.value.trim()
                        }}
                        value={content.value}
                    />
                )}
            </Fragment>
        ),
        hideclose: content.hideclose,
        overlay: content.overlay,
    })
}
