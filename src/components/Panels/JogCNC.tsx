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
    Home,
    ChevronDown,
    Edit3,
    StopCircle,
    MoreHorizontal,
    Crosshair,
    ArrowUp,
    ArrowDown,
    ArrowLeft,
    ArrowRight
} from "preact-feather"
import { useTargetCommands } from "../../hooks"
import { useUiContextFn, useModalsContext } from "../../contexts"
import { T } from "../Translations"
import { Button, ButtonImg, FullScreenButton, CloseButton, ContainerHelper } from "../Controls"
import { useEffect, useState } from "preact/hooks"
import { showModal } from "../Modal"
import { useTargetContext } from "../../targets"
import { Joystick } from "../../targets/CNC/FluidNC/icons"

let currentFeedRate: Record<string, any> = {}
let currentAxis: string = "-1"

const jogStepsXYZ = [100, 10, 1, 0.1] as const
const STEP_ANGLES = [45, 15, -15, -45]

const feedList = ["XY", "Z", "A", "B", "C", "U", "V", "W"]
const selectableAxisLettersList = ["A", "B", "C", "U", "V", "W"]

const CONTINUOUS_JOG_DELAY = 200
const CONTINUOUS_DISTANCE = 5000


const JogQuarter = ({ rotate = 0 }: { rotate?: number }) => (
    <svg
        viewBox="0 0 150 82"
        width="100%"
        height="100%"
        style={{ transform: `rotate(${rotate}deg)` }}
        preserveAspectRatio="xMidYMid meet"
    >
        <g filter="url(#filter0_dd_84_74)">
            <path
                d="M74.5957 0C100.399 -9.84196e-07 125.326 8.48829 145.646 23.917C150.191 27.3678 150.324 33.9932 146.289 38.0283L115.955 68.3623C112.323 71.9948 106.569 72.1903 102.115 69.6299C93.814 64.857 84.3379 62.2803 74.5957 62.2803C64.8535 62.2803 55.3782 64.857 47.0771 69.6299C42.6236 72.1905 36.8698 71.9948 33.2373 68.3623L2.90229 38.0283C-1.13276 33.9932 -0.999008 27.3678 3.54585 23.917C23.8661 8.48846 48.7929 7.61396e-05 74.5957 0ZM62.9013 37.0322V39.2148L65.0292 40.8506L73.8105 32.124V26.124L62.9013 37.0322ZM74.9013 32.124L83.6835 40.8506L85.8105 39.2148V37.0322L74.9013 26.124V32.124Z"
                fill="#E5E5E5"
            />
        </g>
    </svg>
)


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
                                        {axis}
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
                                        {axis}
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
                                    <Crosshair size={"0.9rem" as any} />
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
    const [jogStepIndex, setJogStepIndex] = useState(0) // 100 mm

    const jogDistanceXYZ = jogStepsXYZ[jogStepIndex]

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
    setJogStepIndex((prev) => (prev + 1) % jogStepsXYZ.length)
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
    setJogStepIndex(1) // índice de 10 mm
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
                    <Joystick />
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

                        <div class="jog-axis-header">
                            Machine coordinates
                        </div>

                        <Button
                            m2
                            class="jog-global-btn btn-with-icon"
                            onClick={() => {
                                useUiContextFn.haptic()
                                goToMachineZero()
                            }}
                        >
                            Go <Home size={"0.9rem" as any} />
                        </Button>

                        <PositionsControls
                            mode="mpos"
                            onHomeAxis={sendHomeCommand}
                            onZeroAxis={sendZeroCommand}
                            onWPosClick={showMoveToDialog}
                        />

                        <Button
                            m2
                            class="jog-global-btn btn-with-icon"
                            onClick={() => {
                                useUiContextFn.haptic()
                                sendHomeCommand("")
                            }}
                        >
                            Find <Home size={"0.9rem" as any} />
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
                                goToWorkZero()
                            }}
                        >
                            Go <Crosshair size={"0.9rem" as any} />
                        </Button>

                        <PositionsControls
                            mode="wpos"
                            onHomeAxis={sendHomeCommand}
                            onZeroAxis={sendZeroCommand}
                            onWPosClick={showMoveToDialog}
                        />

                        <Button
                            m2
                            class="jog-global-btn btn-with-icon"
                            onClick={() => {
                                useUiContextFn.haptic()
                                sendZeroCommand("")
                            }}
                        >
                            Set <Crosshair size={"0.9rem" as any} />
                        </Button>
                    </div>


                </div>

                <div class="jog-buttons-main-container">

                    {/* XY */}
                    <div class="jog-axis-group">
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
    useUiContextFn.haptic()
    setJogStepIndex((prev) => (prev + 1) % jogStepsXYZ.length)
  }}
>
  <div
    class="jog-step-knob-indicator"
    style={{
      transform: `rotate(${STEP_ANGLES[jogStepIndex]}deg)`,
    }}
  />

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
                    {(typeof positions.z !== "undefined" ||
                        typeof positions.wz !== "undefined") &&
                        useUiContextFn.getValue("showz") && (
                            <div class="jog-axis-group">
                                <div class="m-1 jog-buttons-container">
                                    <Button m2 {...jogPressHandlers("Z+")}>
                                        <ArrowUp size={20} />
                                    </Button>
                                    <Button m2 {...jogPressHandlers("Z-")}>
                                        <ArrowDown size={20} />
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
                            <div class="form-group m-2 jog-axis-selector">
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
    icon: "Joystick",
    show: "showjogpanel",
    onstart: "openjogonstart",
    settingid: "jog",
}

export { JogPanel, JogPanelElement, PositionsControls }
