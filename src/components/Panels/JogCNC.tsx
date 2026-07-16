/*
Jog.tsx - ESP3D WebUI component file

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

import { Fragment, TargetedEvent, TargetedMouseEvent } from "preact"
import {
    Home,
    Crosshair,
    ArrowUp,
    ArrowDown,
    Sun
} from "preact-feather"
import { useTargetCommands } from "../../hooks"
import { useUiContextFn, useModalsContext } from "../../contexts"
import { T } from "../Translations"
import { Button, FullScreenButton, CloseButton, ContainerHelper } from "../Controls"
import { useEffect, useState } from "preact/hooks"
import { showModal } from "../Modal"
import { useTargetContext } from "../../targets"
import { Joystick } from "../../targets/CNC/FluidNC/icons"
import { useUiContext } from "../../contexts"
import type { StateEntry } from "../../targets/types"
import { JogQuarter } from "./Jog/JogQuarter"
import { PositionsControls } from "./Jog/PositionsControls"
import { useContinuousJog, jogStepsXYZ } from "./Jog/useContinuousJog"
import { useJogKeyboardShortcuts } from "./Jog/useJogKeyboardShortcuts"
import { useLaserFocus } from "./Jog/useLaserFocus"

// These are module-level singletons, so every mounted <JogPanel> instance
// shares the exact same currentFeedRate/currentAxis - there is no per-instance
// state. JogPanel is rendered in two places: the standalone "jog" dashboard
// panel (JogPanelElement) and embedded via <JogPanel embedded /> in Hmi.tsx.
// This used to be a real bug whenever both were mounted at once (jogging the
// additional-axis selector or changing feed rate in one instance silently
// changed it in the other), but Hmi.tsx's useExclusiveFullscreenPanels now
// hides every other dashboard panel while HMI is fullscreen, so only one
// JogPanel is ever mounted at a time - the sharing is safe by construction
// again. If a future layout ever shows both at once on purpose, this needs
// revisiting (per-instance state or a shared, reactive context).
let currentFeedRate: Record<string, number> = {}
let currentAxis: string = "-1"

const STEP_ANGLES = [45, 15, -15, -45]

const feedList = ["XY", "Z", "A", "B", "C", "U", "V", "W"]
const selectableAxisLettersList = ["A", "B", "C", "U", "V", "W"]

// === Local command templates (NO preferences) ===
// '#' will be replaced with axis payload (e.g. "X" or "X0 Y0 Z0")
const HOME_CMD_TEMPLATE = "$H#"
const ZERO_CMD_TEMPLATE = "G10 L20 P1 #"

interface JogPanelProps {
    embedded?: boolean
}

const JogPanel = ({ embedded = false }: JogPanelProps) => {

    const { positions } = useTargetContext()
    const { modals } = useModalsContext()

    const [currentSelectedAxis, setCurrentSelectedAxis] = useState(currentAxis)
    const [jogStepIndex, setJogStepIndex] = useState(0) // 100 mm

    const id = "jogPanel"
    const haptic = () => { useUiContextFn.haptic() }
    const { shortcuts, toolNumbers } = useUiContext()
    const { states, status } = useTargetContext()
    const isIdle = status?.state === "Idle"

    // active_tool is always a single entry (never an array) per how
    // getStates() populates it in filters.ts, unlike other dynamic
    // gcode-mode-based state keys.
    const currentTool = (states.active_tool as StateEntry | undefined)?.value

    const isLaserMode =
        toolNumbers?.laser != null &&
        currentTool != null &&
        Number(currentTool) === Number(toolNumbers.laser)

    const { targetCommands } = useTargetCommands()

    const { laserFocus, toggleLaserFocus } = useLaserFocus({
        isLaserMode,
        isIdle,
        sendGcode: targetCommands,
    })

    const confirmAxisAction = (
        kind: "go-machine-zero" | "go-work-zero" | "home-axis" | "home-all",
        axis?: string
    ) => {
        switch (kind) {
            case "go-machine-zero":
                showModal({
                    modals,
                    id: "confirmGoHome",
                    title: T("CN10"), // Home
                    icon: <Home />,
                    button2: {
                        text: T("S28"), // Cancel
                    },
                    button1: {
                        text: T("S252"), // OK / Apply
                        cb: () => {
                            goToMachineZero()
                        },
                    },
                    content: (
                        <div>
                            {T("S250")}
                        </div>
                    ),
                })
                break
            case "go-work-zero":
                showModal({
                    modals,
                    id: "confirmGoWork",
                    title: T("CN19"), // Zero / Work
                    icon: <Crosshair />,
                    button2: {
                        text: T("S28"), // Cancel
                    },
                    button1: {
                        text: T("S252"), // OK / Apply
                        cb: () => {
                            goToWorkZero()
                        },
                    },
                    content: (
                        <div>
                            {T("S251")}
                        </div>
                    ),
                })
                break
            case "home-axis":
                showModal({
                    modals,
                    id: `confirmHome${axis}`,   // ⬅️ obligatorio en ESP3D
                    title: `${T("CN10")} ${axis}`,
                    icon: <Home />,
                    button2: {
                        text: T("S28"), // Cancel
                    },
                    button1: {
                        text: T("CN204"), // Home
                        cb: () => {
                            sendHomeCommand(axis!)
                        },
                    },
                    content: (
                        <div>
                            {axis
                                ? `${T("S249")} ${axis}?`
                                : `${T("S249")}?`}
                        </div>
                    ),
                })
                break
            case "home-all":
                showModal({
                    modals,
                    id: "confirmHomeAll",
                    title: T("CN10"), // Home
                    icon: <Home />,
                    button2: {
                        text: T("S28"), // Cancel
                    },
                    button1: {
                        text: T("CN204"), // Home
                        cb: () => {
                            sendHomeCommand("")
                        },
                    },
                    content: (
                        <div>
                            {T("S249")}?
                        </div>
                    ),
                })
                break
        }
    }

    // Go to machine zero (G53)
    const goToMachineZero = () => {
        useUiContextFn.haptic()
        targetCommands("G53 G0 X0 Y0 Z0")
    }

    // Go to work zero
    const goToWorkZero = () => {
        useUiContextFn.haptic()
        targetCommands("G0 X0 Y0 Z0")
    }

    // 🔁 rota el stepping (direction = 1 adelante, -1 atrás)
    const rotateJogStep = (direction: 1 | -1 = 1) => {
        setJogStepIndex((prev) => {

            const minIndex = 0
            const maxIndex = jogStepsXYZ.length - 1

            let next = prev + direction

            if (next > maxIndex) next = minIndex
            if (next < minIndex) next = maxIndex

            return next
        })
    }

    const onChangeAxis = (e: TargetedEvent<HTMLSelectElement, Event> | string) => {
        const value = typeof e === "string" ? e : e.currentTarget.value
        setCurrentSelectedAxis(value)
        currentAxis = value
    }

    // Resolves the "Axis+"/"Axis-" selector placeholder to the currently
    // selected axis letter (module-level currentAxis, shared across all
    // JogPanel instances - see the module-level currentFeedRate/currentAxis
    // comment below).
    const resolveAxis = (axis: string): string =>
        axis.startsWith("Axis") ? axis.replace("Axis", currentAxis) : axis

    //Send Home command
    const sendHomeCommand = (axis: string) => {
        let selected_axis = axis === "Axis" ? currentAxis : axis

        // Home all
        if (selected_axis.length === 0) {
            useUiContextFn.haptic()
            targetCommands("$H")
            return
        }

        // Home specific axis (keeps the old behavior)
        // If your firmware doesn't support $HX, this will show an error in terminal.
        const cmd = HOME_CMD_TEMPLATE.replace("#", selected_axis)
        useUiContextFn.haptic()
        targetCommands(cmd)
    }

    //Send Zero command
    const sendZeroCommand = (axis: string) => {
        let payload = ""

        // Axis selector mode
        if (axis === "Axis") {
            payload = `${currentAxis}0`
        } else if (axis.length > 0) {
            // Single axis
            payload = `${axis}0`
        } else {
            // All axes that exist in positions OR wpositions
            const all = ["x", "y", "z", "a", "b", "c", "u", "v", "w"]
            const present = all.filter((l) => {
                return (
                    typeof positions[l] !== "undefined" ||
                    typeof positions[`w${l}`] !== "undefined"
                )
            })

            payload = present.map((l) => `${l.toUpperCase()}0`).join(" ")
        }

        const cmd = ZERO_CMD_TEMPLATE.replace("#", payload.trim())

        useUiContextFn.haptic()
        targetCommands(cmd)
    }

    const sendMoveToCommand = (axis: string, targetPosition: string) => {
        let upperAxis = axis.toUpperCase()
        let feedrate =
            upperAxis.startsWith("X") || upperAxis.startsWith("Y")
                ? currentFeedRate["XY"]
                : upperAxis.startsWith("Z")
                    ? currentFeedRate["Z"]
                    : currentFeedRate[currentAxis]
        const selected_axis = resolveAxis(axis)
        let cmd =
            `$J=G90 G21 ${selected_axis.toUpperCase()}${targetPosition} F${feedrate}`
        targetCommands(cmd)
    }

    const showMoveToDialog = (axis: string, currentPosition: string) => {
        let targetValue = currentPosition
        const axisUpper = axis.toUpperCase()
        showModal({
            modals,
            title: `Move to ${axisUpper} position`,
            button2: { text: T("S28") },
            button1: {
                cb: () => {
                    if (targetValue.length > 0 && !isNaN(parseFloat(targetValue))) {
                        sendMoveToCommand(axisUpper, targetValue)
                    }
                },
                text: T("S43"),
                id: "applyMoveToBtn",
            },
            icon: <Joystick />,
            id: "inputMoveTo",
            content: (
                <Fragment>
                    <div>
                        {T("CN15")?.replace("$", axisUpper) || `Enter target ${axisUpper} position:`}
                    </div>
                    <input
                        class="form-input"
                        type="number"
                        step="0.01"
                        value={targetValue}
                        onInput={(e) => {
                            targetValue = (e.target as HTMLInputElement).value.trim()
                            const btn = document.getElementById("applyMoveToBtn") as HTMLButtonElement
                            if (btn) {
                                btn.disabled = targetValue.length === 0 || isNaN(Number(targetValue))
                            }
                        }}
                    />
                </Fragment>
            ),
        })
    }

    const getContinuousFeedrateForStep = (axis: string, step: number) => {
        let baseFeed =
            axis.startsWith("X") || axis.startsWith("Y")
                ? currentFeedRate["XY"]
                : axis.startsWith("Z")
                    ? currentFeedRate["Z"]
                    : currentFeedRate[currentAxis]

        switch (step) {
            case 100: return baseFeed
            case 10: return baseFeed / 4
            case 1: return baseFeed / 16
            case 0.1: return baseFeed / 64
            default: return baseFeed
        }
    }

    const {
        jogPressHandlers,
        startJog,
        stopJog,
        cancelJog,
        forceCancelJog,
        sendJogCommand,
    } = useContinuousJog({
        jogStepIndex,
        setJogStepIndex,
        getFeedrateForStep: getContinuousFeedrateForStep,
        resolveAxis,
        sendGcode: targetCommands,
    })

    // Axis selector for additional axes (A, B, C, U, V, W)
    const selectorBtn = (type: string) => {
        if (type == "prev" || type == "next") {
            const axisList = selectableAxisLettersList.reduce(
                (acc: string[], letter) => {
                    if (
                        (typeof positions[letter.toLowerCase()] !== "undefined" ||
                            typeof positions[`w${letter.toLowerCase()}`] !== "undefined") &&
                        useUiContextFn.getValue(`show${letter.toLowerCase()}`)
                    ) {


                        acc.push(letter)
                    }

                    return acc
                },
                []
            )

            if (axisList.length > 1) {
                let index = axisList.indexOf(currentAxis)
                if (type == "next") {
                    index++
                    if (index >= axisList.length) index = 0
                } else {
                    index--
                    if (index < 0) index = axisList.length - 1
                }

                const selectElement = document.getElementById("selectAxisList") as HTMLSelectElement
                if (selectElement) {
                    selectElement.value =
                        axisList[index]
                    onChangeAxis(axisList[index])
                }
            }
        }
    }

    useEffect(() => {
        if (currentAxis === "-1") {
            feedList.forEach((letter) => {
                if (!currentFeedRate[letter]) {
                    currentFeedRate[letter] = useUiContextFn.getValue(
                        `${letter.toLowerCase()}feedrate`
                    )
                }
            })

            feedList.forEach((letter) => {
                if (letter !== "XY" && letter !== "Z") {
                    if (
                        (positions[letter.toLowerCase()] ||
                            positions[`w${letter.toLowerCase()}`]) &&
                        useUiContextFn.getValue(`show${letter.toLowerCase()}`)
                    ) {
                        currentAxis = letter
                    }
                }
            })

            setCurrentSelectedAxis(currentAxis)
        }
    }, [positions])

    useJogKeyboardShortcuts({
        enabled: shortcuts.enabled,
        startJog,
        stopJog,
        forceCancelJog,
    })

    return (
        <div class="panel panel-dashboard" id={id} >
            <ContainerHelper id={id} />
            {!embedded && (
                <div class="navbar">

                    {/* IZQUIERDA */}
                    <span class="navbar-section feather-icon-container">
                        <Joystick />
                        <strong class="text-ellipsis">{T("S66")}</strong>
                    </span>

                    {/* CENTRO */}
                    <span class="navbar-section navbar-center">

                    </span>

                    {/* DERECHA */}
                    <span class="navbar-section">
                        <FullScreenButton elementId={id} />
                        <CloseButton elementId={id} hideOnFullScreen={true} />
                    </span>

                </div>
            )}
            <div class="m-1 jog-container">
                {/* ===== POSITIONS GRID ===== */}
                <div class="jog-positions-grid">

                    {/* ===== MPos BOX ===== */}
                    <div class="jog-axis-group">

                        <div class="jog-axis-header">
                            Machine coordinates
                        </div>

                        <Button
                            m2
                            class="jog-global-btn btn-with-icon"
                            onClick={() => {
                                useUiContextFn.haptic()
                                confirmAxisAction("go-machine-zero")
                            }}
                        >
                            {T("S252")} <Home size={"0.9rem" as unknown as number} />
                        </Button>


                        <PositionsControls
                            mode="mpos"
                            onHomeAxis={sendHomeCommand}
                            onZeroAxis={sendZeroCommand}
                            onWPosClick={showMoveToDialog}
                            onConfirmHomeAxis={(axis) => confirmAxisAction("home-axis", axis)}
                        />

                        <Button
                            m2
                            class="jog-global-btn btn-with-icon"
                            onClick={() => {
                                useUiContextFn.haptic()
                                confirmAxisAction("home-all")
                            }}
                        >
                            {T("CN17")} <Home size={"0.9rem" as unknown as number} />
                        </Button>

                    </div>


                    {/* ===== WPos BOX ===== */}
                    <div class="jog-axis-group">

                        <div class="jog-axis-header">
                            Working coordinates
                        </div>

                        <Button
                            m2
                            class="jog-global-btn btn-with-icon"
                            onClick={() => {
                                useUiContextFn.haptic()
                                confirmAxisAction("go-work-zero")
                            }}
                        >
                            {T("S252")} <Crosshair size={"0.9rem" as unknown as number} />
                        </Button>


                        <PositionsControls
                            mode="wpos"
                            onHomeAxis={sendHomeCommand}
                            onZeroAxis={sendZeroCommand}
                            onWPosClick={showMoveToDialog}
                            onConfirmHomeAxis={(axis) => confirmAxisAction("home-axis", axis)}
                        />

                        <Button
                            m2
                            class="jog-global-btn btn-with-icon"
                            onClick={() => {
                                useUiContextFn.haptic()
                                sendZeroCommand("")
                            }}
                        >
                            {T("S43")} <Crosshair size={"0.9rem" as unknown as number} />
                        </Button>
                    </div>


                </div>

                <div class="jog-buttons-main-container">

                    {/* XY */}
                    <div class="jog-axis-group jog-xy-group">

                        {isLaserMode && (
                            <Button
                                m2
                                class={`jog-floating-side-btn ${laserFocus ? "active" : ""}`}
                                disabled={!isIdle}
                                onClick={(e: MouseEvent) => {
                                    if (toggleLaserFocus()) {
                                        (e.currentTarget as HTMLElement).blur()
                                    }
                                }}
                                title="Laser Focus"
                            >
                                <Sun size={18} />
                            </Button>
                        )}

                        <div class="jog-xy-pad">
                            {/* +Y */}
                            <div class="jog-cell jog-arc-up">
                                <Button m2 class="jog-xy-hit" {...jogPressHandlers("Y+")} />

                                <JogQuarter rotate={0} />
                            </div>

                            {/* -X */}
                            <div class="jog-cell jog-arc-left">
                                <Button m2 class="jog-xy-hit" {...jogPressHandlers("X-")} />
                                <JogQuarter rotate={270} />
                            </div>

                            {/* 🔵 PERILLA (centro) */}
                            <div
                                class="jog-step-knob-rotary"
                                onClick={() => {
                                    useUiContextFn.click()
                                    rotateJogStep(1)
                                }}
                            >
                                {/* ◌ Detents vacíos */}
                                {STEP_ANGLES.map((angle, i) => (
                                    <div
                                        key={i}
                                        class="jog-step-detent"
                                        style={{
                                            transform: `rotate(${angle}deg) translateY(-28px)`,
                                        }}
                                    />
                                ))}

                                {/* ● Punto activo */}
                                <div
                                    class="jog-step-knob-indicator"
                                    style={{
                                        transform: `rotate(${STEP_ANGLES[jogStepIndex]}deg) translateY(-28px)`,
                                    }}
                                />

                                {/* Valor numérico */}
                                <div class="jog-step-knob-value">
                                    {jogStepsXYZ[jogStepIndex]}
                                </div>
                            </div>




                            {/* +X */}
                            <div class="jog-cell jog-arc-right">
                                <Button m2 class="jog-xy-hit" {...jogPressHandlers("X+")} />
                                <JogQuarter rotate={90} />
                            </div>

                            {/* -Y */}
                            <div class="jog-cell jog-arc-down">
                                <Button m2 class="jog-xy-hit" {...jogPressHandlers("Y-")} />
                                <JogQuarter rotate={180} />
                            </div>
                        </div>


                    </div>
                    {/* Z */}

                    <div class="jog-axis-group">
                        <div class="m-1 jog-buttons-container">

                            {/* Z+ */}
                            {(() => {
                                const h = jogPressHandlers("Z+")
                                return (
                                    <Button
                                        m2
                                        {...h}
                                        onPointerUp={(e: PointerEvent) => {
                                            h.onPointerUp()
                                                ; (e.currentTarget as HTMLElement).blur()
                                        }}
                                    >
                                        <ArrowUp size={20} />
                                    </Button>
                                )
                            })()}

                            {/* Z- */}
                            {(() => {
                                const h = jogPressHandlers("Z-")
                                return (
                                    <Button
                                        m2
                                        {...h}
                                        onPointerUp={(e: PointerEvent) => {
                                            h.onPointerUp()
                                                ; (e.currentTarget as HTMLElement).blur()
                                        }}
                                    >
                                        <ArrowDown size={20} />
                                    </Button>
                                )
                            })()}



                        </div>
                    </div>
                </div>

                { /* =====================================================
                KEYMAP BRIDGE (Keyboard → Jog actions)
                Do not remove: required for keymap support
                ===================================================== */}

                <div class="d-none">
                    {/* MOVES */}
                    <button
                        id="btn+X"
                        onMouseDown={() => startJog("X+")}
                        onMouseUp={() => stopJog("X+")}
                    />
                    <button
                        id="btn-X"
                        onMouseDown={() => startJog("X-")}
                        onMouseUp={() => stopJog("X-")}
                    />
                    <button
                        id="btn+Y"
                        onMouseDown={() => startJog("Y+")}
                        onMouseUp={() => stopJog("Y+")}
                    />
                    <button
                        id="btn-Y"
                        onMouseDown={() => startJog("Y-")}
                        onMouseUp={() => stopJog("Y-")}
                    />
                    <button
                        id="btn+Z"
                        onMouseDown={() => startJog("Z+")}
                        onMouseUp={() => stopJog("Z+")}
                    />
                    <button
                        id="btn-Z"
                        onMouseDown={() => startJog("Z-")}
                        onMouseUp={() => stopJog("Z-")}
                    />


                    {/* HOME por eje */}
                    <button id="btnHX" onClick={() => sendHomeCommand("X")} />
                    <button id="btnHY" onClick={() => sendHomeCommand("Y")} />
                    <button id="btnHZ" onClick={() => sendHomeCommand("Z")} />

                    {/* ZERO por eje */}
                    <button id="btnZX" onClick={() => sendZeroCommand("X")} />
                    <button id="btnZY" onClick={() => sendZeroCommand("Y")} />
                    <button id="btnZZ" onClick={() => sendZeroCommand("Z")} />

                    {/* HOME / ZERO eje seleccionado */}
                    <button id="btnHaxis" onClick={() => sendHomeCommand("Axis")} />
                    <button id="btnZaxis" onClick={() => sendZeroCommand("Axis")} />

                    {/* HOME / ZERO todo */}
                    <button id="btnHAll" onClick={() => sendHomeCommand("")} />
                    <button id="btnZAll" onClick={() => sendZeroCommand("")} />

                    {/* STOP */}
                    <button id="btnStop" onClick={cancelJog} />
                    <button id="btnEStop" onClick={cancelJog} />

                    {/* DISTANCE SELECT */}
                    <button
                        id="btndistSel+"
                        onClick={() => {
                            useUiContextFn.click()
                            rotateJogStep(-1)
                        }}
                    />

                    <button
                        id="btndistSel-"
                        onClick={() => {
                            useUiContextFn.click()
                            rotateJogStep(1)
                        }}
                    />


                </div>


                {selectableAxisLettersList.reduce((acc, letter) => {
                    if (
                        useUiContextFn.getValue(
                            `show${letter.toLowerCase()}`
                        ) &&
                        (typeof positions[letter.toLowerCase()] !== "undefined" ||
                            typeof positions[`w${letter.toLowerCase()}`] !== "undefined")
                    )
                        acc = true
                    return acc
                }, false as boolean) && (
                        <div class="m-1 jog-buttons-container-horizontal">
                            <div
                                class="d-none"
                                id="btnaxisSel+"
                                onClick={() => {
                                    selectorBtn("next")
                                }}
                            />
                            <div
                                class="d-none"
                                id="btnaxisSel-"
                                onClick={() => {
                                    selectorBtn("prev")
                                }}
                            />
                            <div class="form-group m-2 jog-axis-selector">
                                <select
                                    id="selectAxisList"
                                    class="form-select"
                                    onChange={(e: TargetedEvent<HTMLSelectElement, Event>) => {
                                        haptic()
                                        onChangeAxis(e)
                                    }}
                                    value={currentSelectedAxis}
                                >
                                    {selectableAxisLettersList.map((letter) => {
                                        if (
                                            (typeof positions[letter.toLowerCase()] !== "undefined" ||
                                                typeof positions[`w${letter.toLowerCase()}`] !== "undefined") &&
                                            useUiContextFn.getValue(
                                                `show${letter.toLowerCase()}`
                                            )
                                        )
                                            return (
                                                <option key={letter} value={letter}>
                                                    {letter}
                                                </option>
                                            )
                                    })}
                                </select>
                            </div>
                            <Button
                                m2
                                tooltip
                                data-tooltip={T("CN12")}
                                id="btn+axis"
                                onClick={(e: TargetedMouseEvent<HTMLButtonElement>) => {
                                    useUiContextFn.haptic();
                                    (e.target as HTMLElement).blur();
                                    sendJogCommand("Axis+")
                                }}
                            >
                                +{currentSelectedAxis}
                            </Button>

                            <Button
                                m2
                                tooltip
                                data-tooltip={T("CN13")}
                                id="btn-axis"
                                onClick={(e: TargetedMouseEvent<HTMLButtonElement>) => {
                                    useUiContextFn.haptic();
                                    (e.target as HTMLElement).blur();
                                    sendJogCommand("Axis-")
                                }}
                            >
                                -{currentSelectedAxis}
                            </Button>
                        </div>
                    )}

            </div>
        </div>
    )
}

const JogPanelElement = {
    id: "jogPanel",
    content: <JogPanel />,
    name: "S66",
    icon: "Joystick",
    show: "showjogpanel",
    onstart: "openjogonstart",
    settingid: "jog",
}

export { JogPanel, JogPanelElement }
