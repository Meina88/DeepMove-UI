/*
 extensionBridge.ts - postMessage IPC dispatcher for third-party iframe
 extensions (see the Extension API section of CLAUDE.md / extensions_samples/).
 Split out of areas/index.tsx's processExtensionMessage.

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
import { useEffect } from "preact/hooks"
import { machineSettings } from "../targets"
import { useUiContextFn } from "../contexts/UiContext"
import { useSettingsContextFn } from "../contexts/SettingsContext"
import type { SettingsContextValue } from "../contexts/SettingsContext"
import type { ToastsContextValue } from "../contexts/ToastsContext"
import type { ModalManager } from "../types/modals.types"
import type { HttpQueueReturn } from "../hooks/useHttpQueue"
import {
    espHttpURL,
    dispatchToExtensions,
    isTrustedExtensionMessage,
    sanitizePathSegment,
} from "../components/Helpers"
import { T, baseLangRessource } from "../components/Translations"
import { iconsFeather } from "../components/Images"
import { render } from "preact"
import { exportPreferencesSection } from "../tabs/interface"
import { handleModalMessage } from "./modalFieldsBridge"

export type TargetCommandsFn = (
    commands: string | (() => string[]) | (string | (() => string))[],
    delimiter?: string | number | null,
    methodID?: { id?: string; max?: number; echo?: boolean },
    callbacks?: { onSuccess?: (result: string) => void; onFail?: (error: string) => void }
) => void

export interface ExtensionBridgeDeps {
    createNewRequest: HttpQueueReturn["createNewRequest"]
    targetCommands: TargetCommandsFn
    toasts: ToastsContextValue["toasts"]
    modals: ModalManager
    interfaceSettings: SettingsContextValue["interfaceSettings"]
    connectionSettings: SettingsContextValue["connectionSettings"]
    featuresSettings: SettingsContextValue["featuresSettings"]
}

export function createExtensionMessageHandler(deps: ExtensionBridgeDeps) {
    const {
        createNewRequest,
        targetCommands,
        toasts,
        modals,
        interfaceSettings,
        connectionSettings,
        featuresSettings,
    } = deps

    return (eventMsg: any): void => {
        if (!isTrustedExtensionMessage(eventMsg)) return
        if (eventMsg.data.type && eventMsg.data.target == "webui") {
            switch (eventMsg.data.type) {
                case "response":
                    //TBD: if need real both way communication
                    //between iFrame and Main UI
                    break
                case "cmd": {
                    const cmdCallbacks = {
                        onSuccess: (result: string) => {
                            if (!eventMsg.data.noDispatch)
                                dispatchToExtensions(
                                    "cmd",
                                    {
                                        status: "success",
                                        response: result,
                                        initiator: eventMsg.data,
                                    },
                                    eventMsg.data.id
                                )
                        },
                        onFail: (error: string) => {
                            console.log(error)
                            if (!eventMsg.data.noDispatch)
                                dispatchToExtensions(
                                    "cmd",
                                    {
                                        status: "error",
                                        error: error,
                                        initiator: eventMsg.data,
                                    },
                                    eventMsg.data.id
                                )
                        },
                    }
                    targetCommands(eventMsg.data.content, undefined, undefined, cmdCallbacks)
                    break
                }
                case "query": {
                    let cmd: string | undefined = undefined
                    const queryCallbacks = {
                        onSuccess: (result: string) => {
                            if (!eventMsg.data.noDispatch)
                                dispatchToExtensions(
                                    "query",
                                    {
                                        status: "success",
                                        response: result,
                                        initiator: eventMsg.data,
                                    },
                                    eventMsg.data.id
                                )
                        },
                        onFail: (error: string) => {
                            console.log(error)
                            if (!eventMsg.data.noDispatch)
                                dispatchToExtensions(
                                    "query",
                                    {
                                        status: "error",
                                        error: error,
                                        initiator: eventMsg.data,
                                    },
                                    eventMsg.data.id
                                )
                        },
                    }

                    if (eventMsg.data.url == "command" && !eventMsg.data.arg) {
                        console.log("Command")
                        console.log(eventMsg.data)
                        targetCommands(eventMsg.data.args.cmd, undefined, undefined, queryCallbacks)
                    } else {
                        // This does not fit into the targetCommands paradigm because
                        // either eventMsg.data.url is not "command" or eventMsg.data.args
                        // is not empty
                        createNewRequest(
                            espHttpURL(eventMsg.data.url, eventMsg.data.args),
                            { method: "GET" },
                            queryCallbacks
                        )
                    }
                    createNewRequest(
                        espHttpURL(eventMsg.data.url, eventMsg.data.args),
                        { method: "GET", echo: cmd },
                        {
                            onSuccess: (result: string) => {
                                if (!eventMsg.data.noDispatch)
                                    dispatchToExtensions(
                                        "query",
                                        {
                                            status: "success",
                                            response: result,
                                            initiator: eventMsg.data,
                                        },
                                        eventMsg.data.id
                                    )
                            },
                            onFail: (error: string) => {
                                console.log(error)
                                if (!eventMsg.data.noDispatch)
                                    dispatchToExtensions(
                                        "query",
                                        {
                                            status: "error",
                                            error: error,
                                            initiator: eventMsg.data,
                                        },
                                        eventMsg.data.id
                                    )
                            },
                        }
                    )
                    break
                }
                case "upload": {
                    const uploadPath = sanitizePathSegment(eventMsg.data.path)
                    const uploadFilename = sanitizePathSegment(eventMsg.data.filename)
                    if (uploadPath === null || uploadFilename === null) {
                        console.error(
                            "Rejected upload with unsafe path/filename from extension",
                            eventMsg.data
                        )
                        break
                    }
                    const formData = new FormData()
                    const file = new File(
                        [eventMsg.data.content],
                        uploadFilename
                    )
                    const initiator = {
                        type: "upload",
                        id: eventMsg.data.id,
                        url: eventMsg.data.url,
                        target: eventMsg.data.target,
                        path: eventMsg.data.path,
                        filename: eventMsg.data.filename,
                        size: eventMsg.data.size,
                        args: eventMsg.data.args,
                        noDispatch: eventMsg.data.noDispatch,
                    }
                    //TODO add support for additional POST arguments if needed
                    formData.append("path", uploadPath)
                    formData.append(`${uploadFilename}S`, eventMsg.data.size)
                    formData.append("myfiles", file, uploadFilename)
                    createNewRequest(
                        espHttpURL(eventMsg.data.url, eventMsg.data.args),
                        {
                            method: "POST",
                            id: eventMsg.data.id,
                            body: formData,
                        },
                        {
                            onSuccess: (result: string) => {
                                if (!eventMsg.data.noDispatch)
                                    dispatchToExtensions(
                                        "upload",
                                        {
                                            status: "success",
                                            response: result,
                                            initiator: initiator,
                                        },
                                        eventMsg.data.id
                                    )
                            },
                            onFail: (error: string) => {
                                if (!eventMsg.data.noDispatch)
                                    dispatchToExtensions(
                                        "upload",
                                        {
                                            status: "error",
                                            error,
                                            finitiator: initiator,
                                        },
                                        eventMsg.data.id
                                    )
                            },
                            onProgress: (e: any) => {
                                if (!eventMsg.data.noDispatch)
                                    dispatchToExtensions(
                                        "upload",
                                        {
                                            status: "progress",
                                            progress: e,
                                            initiator: initiator,
                                        },
                                        eventMsg.data.id
                                    )
                            },
                        }
                    )
                    break
                }
                case "download": {
                    const downloadArgs = { ...eventMsg.data.args }
                    if ("path" in downloadArgs) {
                        const sanitized = sanitizePathSegment(downloadArgs.path)
                        if (sanitized === null) {
                            console.error(
                                "Rejected download with unsafe path from extension",
                                eventMsg.data
                            )
                            break
                        }
                        downloadArgs.path = sanitized
                    }
                    if ("filename" in downloadArgs) {
                        const sanitized = sanitizePathSegment(downloadArgs.filename)
                        if (sanitized === null) {
                            console.error(
                                "Rejected download with unsafe filename from extension",
                                eventMsg.data
                            )
                            break
                        }
                        downloadArgs.filename = sanitized
                    }
                    createNewRequest(
                        espHttpURL(eventMsg.data.url, downloadArgs),
                        { method: "GET", id: "download" },
                        {
                            onSuccess: (result: string) => {
                                if (!eventMsg.data.noDispatch)
                                    dispatchToExtensions(
                                        "download",
                                        {
                                            status: "success",
                                            response: result,
                                            initiator: eventMsg.data,
                                        },
                                        eventMsg.data.id
                                    )
                            },
                            onFail: (error: string) => {
                                if (!eventMsg.data.noDispatch)
                                    dispatchToExtensions(
                                        "download",
                                        {
                                            status: "error",
                                            error: error,
                                            initiator: eventMsg.data,
                                        },
                                        eventMsg.data.id
                                    )
                            },
                            onProgress: (e: any) => {
                                if (!eventMsg.data.noDispatch)
                                    dispatchToExtensions(
                                        "download",
                                        {
                                            status: "progress",
                                            progress: e,
                                            initiator: eventMsg.data,
                                        },
                                        eventMsg.data.id
                                    )
                            },
                        }
                    )
                    break
                }
                case "toast":
                    toasts.addToast({
                        content: eventMsg.data.content.text,
                        type: eventMsg.data.content.type,
                    })
                    break
                case "modal":
                    handleModalMessage(eventMsg, modals)
                    break
                case "sound":
                    if (eventMsg.data.content == "beep") useUiContextFn.beep()
                    if (eventMsg.data.content == "error")
                        useUiContextFn.beepError()
                    if (eventMsg.data.content == "seq")
                        useUiContextFn.beepSeq(eventMsg.data.seq)
                    break
                case "translate":
                    if (eventMsg.data.all) {
                        dispatchToExtensions(
                            "translate",
                            {
                                response: baseLangRessource,
                                initiator: eventMsg.data,
                            },
                            eventMsg.data.id
                        )
                    } else {
                        dispatchToExtensions(
                            "translate",
                            {
                                response: T(eventMsg.data.content),
                                initiator: eventMsg.data,
                            },
                            eventMsg.data.id
                        )
                    }
                    break
                case "icon": {
                    const iconToSend = iconsFeather[eventMsg.data.id as keyof typeof iconsFeather]
                    let iconSvgString = ""
                    if (iconToSend) {
                        //Temporary DOM
                        const tempElement = document.createElement("div")
                        //DO icon rendering
                        render(iconToSend, tempElement)
                        //Get the SVG string
                        iconSvgString = tempElement.firstChild ? (tempElement.firstChild as Element).outerHTML : ""
                        //Delete the temporary DOM
                        tempElement.remove()
                    } else {
                        iconSvgString = ""
                        console.error("Icon not found:", eventMsg.data.id)
                    }

                    dispatchToExtensions(
                        "icon",
                        {
                            response: iconSvgString.replaceAll("\"", "'"),
                            initiator: eventMsg.data,
                        },
                        eventMsg.data.id
                    )
                    break
                }
                case "extensionsData": {
                    //Get extension name
                    const section = eventMsg.data.id
                    //Get extensions settings
                    const data = eventMsg.data.content
                    //Some sanity check
                    if (!interfaceSettings.current.extensions) {
                        interfaceSettings.current.extensions = {}
                    }
                    if (!interfaceSettings.current.extensions[section]) {
                        interfaceSettings.current.extensions[section] = {}
                    }
                    //Update the settings
                    //Note: it will overwrite the whole section
                    interfaceSettings.current.extensions[section] = data

                    //now do a copy of interfaceSettings
                    const interfaceSettingsData = JSON.parse(
                        JSON.stringify(interfaceSettings.current)
                    )

                    //now update the settings section with export version

                    interfaceSettingsData.settings = exportPreferencesSection(interfaceSettingsData.settings, false, true)

                    //now stringify and save
                    const preferencestosave = JSON.stringify(
                        interfaceSettingsData,
                        null,
                        " "
                    )
                    //Create a blob
                    const blob = new Blob([preferencestosave], {
                        type: "application/json",
                    })
                    //Create a file
                    const preferencesFileName =
                        `${useSettingsContextFn.getValue("HostUploadPath")
                        }preferences.json`
                    const formDataExtensions = new FormData()
                    const file_to_save = new File([blob], preferencesFileName)
                    formDataExtensions.append(
                        "path",
                        useSettingsContextFn.getValue("HostUploadPath")
                    )
                    formDataExtensions.append("creatPath", "true")
                    formDataExtensions.append(
                        `${preferencesFileName}S`,
                        preferencestosave.length.toString()
                    )
                    formDataExtensions.append(
                        "myfiles",
                        file_to_save,
                        preferencesFileName
                    )
                    //Send the file
                    createNewRequest(
                        espHttpURL(useSettingsContextFn.getValue("HostTarget")),
                        {
                            method: "POST",
                            id: "preferences",
                            body: formDataExtensions,
                        },
                        {
                            onSuccess: (_result: string) => {
                                dispatchToExtensions(
                                    "extensionsData",
                                    {
                                        response: { status: "success" },
                                        initiator: eventMsg.data,
                                    },
                                    eventMsg.data.id
                                )
                            },
                            onFail: (_error: string) => {
                                dispatchToExtensions(
                                    "extensionsData",
                                    {
                                        response: { status: "error" },
                                        initiator: eventMsg.data,
                                    },
                                    eventMsg.data.id
                                )
                            },
                        }
                    )

                    break
                }
                case "capabilities": {
                    let response: any = {}
                    switch (eventMsg.data.id) {
                        case "connection":
                            response = JSON.parse(
                                JSON.stringify(connectionSettings.current)
                            )
                            break
                        case "settings":
                            response = JSON.parse(
                                JSON.stringify(machineSettings)
                            )
                            break
                        case "interface":
                            response = JSON.parse(
                                JSON.stringify(interfaceSettings.current)
                            )
                            break
                        case "features":
                            response = JSON.parse(
                                JSON.stringify(featuresSettings.current)
                            )
                            break
                        case "extensions":
                            if (interfaceSettings.current.extensions) {
                                if (
                                    interfaceSettings.current.extensions[
                                    eventMsg.data.name
                                    ]
                                ) {
                                    response = JSON.parse(
                                        JSON.stringify(
                                            interfaceSettings.current
                                                .extensions[eventMsg.data.name]
                                        )
                                    )
                                } else {
                                    response = "{}"
                                }
                            } else {
                                response = "{}"
                            }
                            break
                        default:
                            response = {}
                    }
                    dispatchToExtensions(
                        "capabilities",
                        {
                            response: response,
                            initiator: eventMsg.data,
                        },
                        eventMsg.data.id
                    )
                    break
                }
                case "dispatch":
                    dispatchToExtensions(
                        "dispatch",
                        {
                            response: eventMsg.data.content,
                            initiator: eventMsg.data,
                        },
                        eventMsg.data.targetid
                    )
                    break

                default:
                    //core and stream are only supposed to come from ESP3D or main FW
                    return
            }
        }
    }
}

export function useExtensionBridge(deps: ExtensionBridgeDeps): void {
    useEffect(() => {
        const handler = createExtensionMessageHandler(deps)
        window.addEventListener("message", handler, false)
        return () => {
            window.removeEventListener("message", handler, false)
        }
        // Mount-only: deps holds context values recreated (non-memoized) on every
        // render; re-registering the listener on every render would also mean
        // briefly having zero or duplicate listeners attached.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
}
