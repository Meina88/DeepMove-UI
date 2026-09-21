/*
 dashboard.js - ESP3D WebUI navigation page file

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
import { Fragment, FunctionalComponent, JSX } from "preact"
import { useEffect, useState } from "preact/hooks"
import { useUiContext, useUiContextFn } from "../../contexts"
import type { Panel } from "../../contexts/UiContext"
import { defaultPanelsList } from "../../targets"
import { ExtraPanelElement } from "../../components/Panels/ExtraPanel"
import PanelNavigator from "../../components/Controls/PanelNavigator"
import type { PreferencesFieldData } from "../../types/preferences.types"
import { shouldInitPanels } from "./panelsInit"


interface KeyTracker {
    keybListenerCounter: number
    keyState: number
    lastcall: Date
    lastkey: string
}

interface FixedPanel {
    index: number
    id: string
}

const fixedPanels: FixedPanel[] = []
const keyTracker: KeyTracker = {
    keybListenerCounter: 0,
    keyState: 0,
    lastcall: new Date(),
    lastkey: "",
}

//Need to put outside of Dashboard object to be sure add/remove alsways use same address
const keyboardEventHandlerUp = (_e: KeyboardEvent): void => {
    keyTracker.keyState = 0
}

const keyboardEventHandlerDown = (e: KeyboardEvent): void => {
    // Bail if User is actively typing text.  We don't want to disrupt them entering gcode.
    if (
        document.activeElement &&
        document.activeElement.tagName == "INPUT" &&
        ((document.activeElement as HTMLInputElement).type == "text" ||
            (document.activeElement as HTMLInputElement).type == "number")
    ) {
        return
    }

    let keyval = ""
    if (e.ctrlKey) keyval += "Control+"
    if (e.altKey) keyval += "Alt+"
    if (e.shiftKey) keyval += "Shift+"
    if (e.metaKey) keyval += "Meta+"
    if (
        !(
            e.key == "Control" ||
            e.key == "Alt" ||
            e.key == "Shift" ||
            e.key == "Meta"
        )
    )
        keyval += e.key.toUpperCase()
    let cmdMatch: string | null = null
    const keysRefs: string[] = ["keymap", "macros"]
    keysRefs.forEach((list: string) => {
        const keyMapObj: PreferencesFieldData[] | undefined = useUiContextFn.getValue(list)
        if (keyMapObj) {
            keyMapObj.forEach((element: PreferencesFieldData) => {
                element.value.forEach((sub: PreferencesFieldData) => {
                    if (
                        sub.name == "key" &&
                        sub.value &&
                        sub.value.length > 0 &&
                        sub.value?.toUpperCase() == keyval?.toUpperCase() &&
                        document.getElementById(element.id)
                    ) {
                        cmdMatch = element.id
                    }
                })
            })
        }
    })

    //console.log("KeyMap override match, key = " + e.key + ", cmd= " + cmdMatch)

    if (cmdMatch) {
        e.preventDefault()
        if (keyTracker.keyState == 1) return
        keyTracker.keyState = 1
        keyTracker.lastkey = keyval

        const element = document.getElementById(cmdMatch)
        if (element) {
            element.click()
        }
    }
}
let intialisationDone = false

const Dashboard: FunctionalComponent = (): JSX.Element => {
    console.log("Dashboard")
    const { panels, uisettings, shortcuts } = useUiContext()
    const isfixed = uisettings.getValue("fixedpanels")
    const [, setIsKeyboardEnabled] = useState<boolean>(shortcuts.enabled)

    //Add keyboard listener
    const AddKeyboardListener = (): void => {
        if (keyTracker.keybListenerCounter == 0) {
            window.addEventListener("keydown", keyboardEventHandlerDown as EventListener, true)
            window.addEventListener("keyup", keyboardEventHandlerUp as EventListener, true)
            keyTracker.keybListenerCounter++
        }
    }

    //Remove keyboard listener
    const RemoveKeyboardListener = (): void => {
        if (keyTracker.keybListenerCounter != 0) {
            window.removeEventListener(
                "keydown",
                keyboardEventHandlerDown as EventListener,
                true
            )
            window.removeEventListener("keyup", keyboardEventHandlerUp as EventListener, true)
            keyTracker.keybListenerCounter--
        }
    }

    useEffect(() => {
        if (!intialisationDone) {
            //console.log("Init")
            intialisationDone = true
            //console.log(uisettings.getValue("enableshortcuts"))
            setIsKeyboardEnabled(uisettings.getValue("enableshortcuts"))
            shortcuts.enable(uisettings.getValue("enableshortcuts"))
        } else {
            //console.log("Init Done")
        }
        return () => {
            //console.log("Unmount dashboard")
        }
        // Mount-only bootstrap: shortcuts/uisettings are context values recreated every render; adding
        // them here would re-run keyboard-shortcut initialization on every unrelated re-render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (shortcuts.enabled) {
            AddKeyboardListener()
        }
        return () => {
            if (shortcuts.enabled) {
                RemoveKeyboardListener()
            }
        }
    }, [shortcuts.enabled])

    useEffect(() => {
        if (shouldInitPanels(panels.initDone, panels.list.length, uisettings.current !== undefined)) {
            if (isfixed && fixedPanels.length == 0) {
                const panelOrder: PreferencesFieldData[] = uisettings.getValue("panelsorder")
                panelOrder.forEach((panel) => {
                    fixedPanels.push({
                        index: panel.index,
                        id: panel.value[0].value,
                    })
                })
                panels.setPanelsOrder(fixedPanels)
                const newList = fixedPanels.reduce((acc: Panel[], panel) => {
                    const paneldesc = panels.list.filter(
                        (p) => p.settingid == panel.id
                    )
                    if (paneldesc.length > 0) acc.push(...paneldesc)
                    return acc
                }, [] as Panel[])
                panels.set([...newList])
                panels.setVisibles(
                    newList.reduce((acc: Panel[], curr) => {
                        if (
                            uisettings.getValue(curr.onstart as string) &&
                            uisettings.getValue(curr.show as string)
                        )
                            acc.push(curr)
                        return acc
                    }, [] as Panel[])
                )
            } else {
                panels.setVisibles(
                    panels.list.reduce((acc: Panel[], curr) => {
                        if (
                            uisettings.getValue(curr.onstart as string) &&
                            uisettings.getValue(curr.show as string)
                        )
                            acc.push(curr)
                        return acc
                    }, [] as Panel[])
                )
            }

            panels.setInitDone(true)
        } else {
            //now remove if any visible that is not in list
            panels.visibles.forEach((element) => {
                if (!panels.list.find((panel) => panel.id == element.id))
                    panels.hide(element.id)
            })
        }
    })

    useEffect(() => {
        if (uisettings.getValue("showextracontents")) {
            const extraContents: PreferencesFieldData[] = uisettings.getValue("extracontents")
            const extraPanelsList = extraContents.reduce((acc: Panel[], curr) => {
                const item = curr.value.reduce((accumulator: Record<string, any>, current: PreferencesFieldData) => {
                    accumulator[current.name!] = current.initial
                    return accumulator
                }, {})

                if (item.target == "panel") {
                    acc.push(ExtraPanelElement(item, curr.id))
                }
                return acc
            }, [] as Panel[])
            panels.set([...defaultPanelsList, ...extraPanelsList])
        } else {
            panels.set([...defaultPanelsList])
        }

        //now remove if any visible that is not in list
        panels.visibles.forEach((element) => {
            if (!uisettings.getValue(element.show as string)) panels.hide(element.id)
        })
        // Mount-only bootstrap: panels/uisettings are context values recreated every render; adding
        // them here would reset the panels list on every unrelated re-render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div id="dashboard">
            <div class="panels-container m-2">
                {panels.visibles.map((panel: Panel) => {
                    return <Fragment key={panel.id}>{panel.content as JSX.Element}</Fragment>
                })}
            </div>
            <PanelNavigator />
        </div>
    )
}

export default Dashboard
