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

import { Fragment } from "preact"
import {
    Move,
    Home,
    ChevronDown,
    Edit3,
    StopCircle,
    MoreHorizontal,
} from "preact-feather"
import { useTargetCommands } from "../../hooks"
import { useUiContextFn, useModalsContext } from "../../contexts"
import { T } from "../Translations"
import { Button, ButtonImg, FullScreenButton, CloseButton, ContainerHelper } from "../Controls"
import { useEffect, useState } from "preact/hooks"
import { showModal } from "../Modal"
import { useTargetContext } from "../../targets"

let currentFeedRate: Record<string, any> = {}
let currentJogStepIndex = 0
const jogStepsXYZ = [100, 10, 1, 0.1] as const
let currentAxis: string = "-1"

const feedList = ["XY", "Z", "A", "B", "C", "U", "V", "W"]
const selectableAxisLettersList = ["A", "B", "C", "U", "V", "W"]

const CONTINUOUS_JOG_DELAY = 200
const CONTINUOUS_DISTANCE = 5000

/*
 * Local const
 *
 */
//A separate control to avoid the full panel to be updated when the positions are updated
interface PositionsControlsProps {
    mode: "mpos" | "wpos"
    onWPosClick: (letter: string, position: string) => void
    onHomeAxis: (axis: string) => void
    onZeroAxis: (axis: string) => void
}



const PositionsControls = ({
    mode,
    onWPosClick,
    onHomeAxis,
    onZeroAxis,
}: PositionsControlsProps) => {
    const { positions } = useTargetContext()   // ✅ acá adentro
    const isMPos = mode === "mpos"
    const isWPos = mode === "wpos"



    return (
    <Fragment>
        {["x", "y", "z"].map((letter) => {
            const hasM = typeof positions[letter] !== "undefined"
            const hasW = typeof positions[`w${letter}`] !== "undefined"

            if (isMPos && !hasM) return null
            if (isWPos && !hasW) return null
            if (!useUiContextFn.getValue(`show${letter}`)) return null

            const axis = letter.toUpperCase()

            return (
                <div key={letter} class="jog-positions-ctrls m-1">

                    {/* ===== MPos ===== */}
                    {isMPos && (
                        <div class="jog-position-row">
                            <Button
                                m1
                                class="jog-position-action"
                                tooltip
                                data-tooltip={T("CN10")}
                                onClick={() => {
                                    useUiContextFn.haptic()
                                    onHomeAxis(axis)
                                }}
                            >
                                <Home size={"0.9rem" as any} />
                            </Button>

                            <div class="jog-position-ctrl">
                                <div class="jog-position-sub-header">
                                    MPos {axis}
                                </div>
                                <div class="jog-position-value">
                                    {positions[letter]}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== WPos ===== */}
                    {isWPos && (
                        <div class="jog-position-row">
                            <div class="jog-position-ctrl">
                                <div class="jog-position-sub-header">
                                    WPos {axis}
                                </div>
                                <div
                                    class="jog-position-value jog-position-clickable"
                                    onClick={() => {
                                        useUiContextFn.haptic()
                                        onWPosClick(letter, positions[`w${letter}`])
                                    }}
                                >
                                    {positions[`w${letter}`]}
                                </div>
                            </div>

                            <Button
                                m1
                                class="jog-position-action"
                                tooltip
                                data-tooltip={T("CN19")}
                                onClick={() => {
                                    useUiContextFn.haptic()
                                    onZeroAxis(axis)
                                }}
                            >
                                &Oslash;
                            </Button>
                        </div>
                    )}

                </div>
            )
        })}
    </Fragment>
)

}


const JogPanel = () => {
    const { positions } = useTargetContext()
    const { modals } = useModalsContext()
    const [currentSelectedAxis, setCurrentSelectedAxis] = useState(currentAxis)
    const [jogDistanceXYZ, setJogDistanceXYZ] = useState<number>(100)
    const [jogTimer, setJogTimer] = useState<number | null>(null)
    const [continuousActive, setContinuousActive] = useState(false)
    const id = "jogPanel"
    const haptic = () => { useUiContextFn.haptic() }


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

    // 🔁 rota el stepping: 100 → 10 → 1 → 0.1 → 100
    const rotateJogStep = () => {
        setJogDistanceXYZ((prev) => {
            const idx = jogStepsXYZ.indexOf(prev as any)
            const nextIdx = (idx + 1) % jogStepsXYZ.length
            return jogStepsXYZ[nextIdx]
        })
    }


    const onChangeAxis = (e: any) => {
        let value = e.target ? e.target.value : e
        setCurrentSelectedAxis(value)
        currentAxis = value
    }

    const { targetCommands } = useTargetCommands()

    //Send Home command
    const sendHomeCommand = (axis: string) => {
        let selected_axis
        if (axis == "Axis") selected_axis = currentAxis
        else selected_axis = axis
        const cmd = useUiContextFn
            .getValue("homecmd")
            .replace("#", selected_axis)
        targetCommands(cmd)
    }

    //Send Zero command
    const sendZeroCommand = (axis: string) => {
        let selected_axis: string
        if (axis == "Axis") selected_axis = `${currentAxis}0`
        else selected_axis = `${axis}0`
        if (axis.length == 0) {
            selected_axis = ""
            "xyzabcuvw".split("").reduce((acc, letter) => {
                if (positions[letter] || positions[`w${letter}`])
                    acc += selected_axis += ` ${letter.toUpperCase()}0`
                return acc
            }, "")
        }
        const cmd = useUiContextFn
            .getValue("zerocmd")
            .replace("#", selected_axis.trim())
        targetCommands(cmd)
    }

    const sendMoveToCommand = (axis: string, targetPosition: string) => {
        let upperAxis = axis.toUpperCase()
        let selected_axis: string
        let feedrate =
            upperAxis.startsWith("X") || upperAxis.startsWith("Y")
                ? currentFeedRate["XY"]
                : upperAxis.startsWith("Z")
                    ? currentFeedRate["Z"]
                    : currentFeedRate[currentAxis]
        if (axis.startsWith("Axis"))
            selected_axis = axis.replace("Axis", currentAxis)
        else selected_axis = axis
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
            icon: <Move />,
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
                                btn.disabled = targetValue.length === 0 || isNaN(targetValue as any)
                            }
                        }}
                    />
                </Fragment>
            ),
        })
    }

    const sendJogCommand = (axis: string) => {
        let selected_axis: string
        let distance: string | number
        let feedrate =
            axis.startsWith("X") || axis.startsWith("Y")
                ? currentFeedRate["XY"]
                : axis.startsWith("Z")
                    ? currentFeedRate["Z"]
                    : currentFeedRate[currentAxis]

        distance = jogDistanceXYZ


        if (axis.startsWith("Axis"))
            selected_axis = axis.replace("Axis", currentAxis)
        else selected_axis = axis
        let cmd =
            `$J=G91 G21 ${selected_axis}${distance} F${feedrate}`
        targetCommands(cmd)
    }
    const getContinuousFeedrate = (axis: string) => {
        let baseFeed =
            axis.startsWith("X") || axis.startsWith("Y")
                ? currentFeedRate["XY"]
                : axis.startsWith("Z")
                    ? currentFeedRate["Z"]
                    : currentFeedRate[currentAxis]

        switch (jogDistanceXYZ) {
            case 100: return baseFeed
            case 10: return baseFeed / 2
            case 1: return baseFeed / 4
            case 0.1: return baseFeed / 8
            default: return baseFeed
        }
    }

    const sendContinuousJog = (axis: string) => {
        const feed = getContinuousFeedrate(axis)
        const cmd = `$J=G91 G21 ${axis}${CONTINUOUS_DISTANCE} F${feed}`
        targetCommands(cmd)
    }

    const cancelJog = () => {
        // Jog Cancel es un comando realtime (un byte), NO gcode
        targetCommands("\x85")
    }

    const forceCancelJog = () => {
        if (jogTimer) {
            clearTimeout(jogTimer)
            setJogTimer(null)
        }

        if (continuousActive) {
            cancelJog()
            setContinuousActive(false)
        }

        // restaurar scroll si lo bloqueamos
        document.body.style.overflow = ""
    }


    const jogPressHandlers = (axis: string) => ({
        onPointerDown: () => {
            useUiContextFn.haptic()
            document.body.style.overflow = "hidden"

            // 🔐 Protección eje Z:
            // Si estamos en stepping 100 y se toca Z, forzar stepping a 10
            if (
                jogDistanceXYZ === 100 &&
                (axis === "Z+" || axis === "Z-")
            ) {
                setJogDistanceXYZ(10)
            }



            const timer = window.setTimeout(() => {
                setContinuousActive(true)
                sendContinuousJog(axis)
            }, CONTINUOUS_JOG_DELAY)

            setJogTimer(timer)
        },

        onPointerUp: () => {
            if (jogTimer) {
                clearTimeout(jogTimer)
                setJogTimer(null)
            }

            if (continuousActive) {
                forceCancelJog()
            } else {
                sendJogCommand(axis)
                document.body.style.overflow = ""
            }

        },


        onPointerLeave: () => {
            forceCancelJog()
        },

        onPointerCancel: () => {
            forceCancelJog()
        }

    })

    //Set the current feedrate for axis//
    const setFeedrate = (axis: string) => {
        let value = currentFeedRate[axis]
        let t
        if (axis == "XY") {
            t = T("CN2")
        } else {
            t = T("CN3").replace("$", axis)
        }
        showModal({
            modals,
            title: t,
            button2: { text: T("S28") },
            button1: {
                cb: () => {
                    if (value.length > 0.1 as any) currentFeedRate[axis] = value
                },
                text: T("S43"),
                id: "applyFrBtn",
            },
            icon: <Edit3 />,
            id: "inputFeedrate",
            content: (
                <Fragment>
                    <div>{t}</div>
                    <input
                        class="form-input"
                        type="number"
                        step="0.1"
                        value={value}
                        onInput={(e) => {
                            value = (e.target as HTMLInputElement).value.trim()
                            const btn = document.getElementById("applyFrBtn") as HTMLButtonElement
                            if (parseFloat(value) < 0.1) {
                                if (btn) {
                                    btn.disabled = true
                                }
                            } else {
                                if (btn) {
                                    btn.disabled = false
                                }
                            }
                        }}
                    />
                </Fragment>
            ),
        })
    }

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
        // 🔹 inicializamos el stepping UNA SOLA VEZ
        setJogDistanceXYZ(jogStepsXYZ[0]) // 100

        // 🔹 inicialización de feedrates y eje actual
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

        const onScroll = () => {
            forceCancelJog()
        }

        window.addEventListener("scroll", onScroll, { passive: true })


        return () => {
            window.removeEventListener("scroll", onScroll)
            forceCancelJog()
        }

    }, [])   // ⬅️ CLAVE ABSOLUTA


    return (
        <div class="panel panel-dashboard" id={id} >
            <ContainerHelper id={id} />
            <div class="navbar">
                <span class="navbar-section feather-icon-container">
                    <Move />
                    <strong class="text-ellipsis">{T("S66")}</strong>
                </span>
                <span class="navbar-section">
                    <span class="H-100">
                        <div class="dropdown dropdown-right">
                            <span
                                class="dropdown-toggle btn btn-xs btn-header m-1"
                                tabIndex={0}
                            >
                                <ChevronDown size={"0.8rem" as any} />
                            </span>

                            <ul class="menu">
                                {feedList.map((letter) => {
                                    let help
                                    let condition = false
                                    if (letter.length == 2) {
                                        help = T("CN2")
                                        condition =
                                            (useUiContextFn.getValue("showx") &&
                                                (positions.x ||
                                                    positions.wx)) ||
                                            (useUiContextFn.getValue("showy") &&
                                                (positions.y || positions.wy))
                                    } else {
                                        help = T("CN3").replace("$", letter)
                                        condition =
                                            (typeof positions[letter.toLowerCase()] !== "undefined" ||
                                                typeof positions[`w${letter.toLowerCase()}`] !== "undefined") &&
                                            useUiContextFn.getValue(
                                                `show${letter.toLowerCase()}`
                                            )
                                    }
                                    if (condition)
                                        return (
                                            <li key={letter} class="menu-item">
                                                <div
                                                    class="menu-entry"
                                                    onClick={(_e: any) => {

                                                        useUiContextFn.haptic()
                                                        setFeedrate(letter)
                                                    }}
                                                >
                                                    <div class="menu-panel-item">
                                                        <span class="text-menu-item">
                                                            {help}
                                                        </span>
                                                    </div>
                                                </div>
                                            </li>
                                        )
                                })}
                            </ul>
                        </div>
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
            <div class="m-1 jog-container">
                {/* ===== POSITIONS GRID ===== */}
                <div class="jog-positions-grid">

                    {/* ===== MPos BOX ===== */}
                    <div class="jog-axis-group">
                        <Button m2 class="jog-goto-btn" onClick={goToMachineZero}>
                            Go to M0
                        </Button>

                        <PositionsControls
                            mode="mpos"
                            onHomeAxis={sendHomeCommand}
                            onZeroAxis={sendZeroCommand}
                            onWPosClick={showMoveToDialog}
                        />

                        <Button
                            m2
                            class="jog-global-btn"
                            onClick={() => sendHomeCommand("")}
                        >
                            Home XYZ
                        </Button>
                    </div>

                    {/* ===== WPos BOX ===== */}
                    <div class="jog-axis-group">
                        <Button m2 class="jog-goto-btn" onClick={goToWorkZero}>
                            Go to W0
                        </Button>

                        <PositionsControls
                            mode="wpos"
                            onHomeAxis={sendHomeCommand}
                            onZeroAxis={sendZeroCommand}
                            onWPosClick={showMoveToDialog}
                        />

                        <Button
                            m2
                            class="jog-global-btn"
                            onClick={() => sendZeroCommand("")}
                        >
                            Zero XYZ
                        </Button>
                    </div>

                </div>

                <div class="jog-buttons-main-container">

                    {/* XY */}
                    <div class="jog-axis-group">
                        <div class="jog-xy-pad">

                            {/* +Y */}
                            <Button m2 {...jogPressHandlers("Y+")}>+Y</Button>

                            {/* -X */}
                            <Button m2 {...jogPressHandlers("X-")}>-X</Button>

                            {/* 🔵 PERILLA (solo visual) */}
                            <div
                                class="jog-step-knob"
                                onClick={() => {
                                    useUiContextFn.haptic()
                                    rotateJogStep()
                                }}
                            >
                                {jogDistanceXYZ}
                            </div>


                            {/* +X */}
                            <Button m2 {...jogPressHandlers("X+")}>+X</Button>

                            {/* -Y */}
                            <Button m2 {...jogPressHandlers("Y-")}>-Y</Button>

                        </div>
                    </div>
                    {/* Z */}
                    {(typeof positions.z !== "undefined" ||
                        typeof positions.wz !== "undefined") &&
                        useUiContextFn.getValue("showz") && (
                            <div class="jog-axis-group">
                                <div class="m-1 jog-buttons-container">
                                    <Button m2 {...jogPressHandlers("Z+")}>
                                        +Z
                                    </Button>
                                    <Button m2 {...jogPressHandlers("Z-")}>
                                        -Z
                                    </Button>
                                </div>
                            </div>
                        )}
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
                            <div class="form-group m-2 text-primary">
                                <select
                                    id="selectAxisList"
                                    class="form-select"
                                    onChange={(e: any) => {
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
                                                <option value={letter}>
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
                                onClick={(e: any) => {
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
                                onClick={(e: any) => {
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
    icon: "Move",
    show: "showjogpanel",
    onstart: "openjogonstart",
    settingid: "jog",
}

export { JogPanel, JogPanelElement, PositionsControls }
