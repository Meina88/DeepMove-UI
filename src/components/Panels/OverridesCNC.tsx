import { Fragment, TargetedMouseEvent } from "preact"
import { useEffect, useRef, useState } from "preact/hooks"
import type { FunctionalComponent } from "preact"
import { T } from "../Translations"
import { Repeat, Play, Pause } from "preact-feather"
import { useUiContextFn } from "../../contexts"
import { useTargetContext } from "../../targets"
import { ButtonImg, FullScreenButton, CloseButton, ContainerHelper } from "../Controls"
import { useTargetCommands } from "../../hooks"

/*
 * Local const
 *
 */

type OverrideId = "spindle" | "feed" | "rapid"
type Overrides = Partial<Record<OverrideId, number>> & Record<string, number | undefined>

const OverridesControls: FunctionalComponent = () => {
    const { overrides } = useTargetContext() as unknown as { overrides: Overrides }
    if (!useUiContextFn.getValue("showoverridespanel")) return null

    const overrides_array: Array<{ id: OverrideId; label: string; tooltip: string }> = [
        { id: "spindle", label: "CN64", tooltip: "CN67" },
        { id: "feed", label: "CN9", tooltip: "CN68" },
        { id: "rapid", label: "CN63", tooltip: "CN69" },
    ]
    return (
        <Fragment>
            {overrides && (
                <div class="status-ctrls">
                    {overrides_array.map((element) => {
                        if (overrides[element.id] != null) {
                            return (
                                <div key={element.id}
                                    class="extra-control mt-1 tooltip tooltip-bottom"
                                    data-tooltip={T(element.tooltip)}
                                >
                                    <div class="extra-control-header">
                                        {T(element.label)}
                                    </div>

                                    <div class="extra-control-value">
                                        {overrides[element.id]}%
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

type ButtonConfig = { label: string; tooltip: string; command: string; iconRight?: boolean }
type ButtonsGroup = { label: string; buttons: ButtonConfig[] }

const OverridesPanel: FunctionalComponent = () => {
    const { targetCommands } = useTargetCommands()
    const { status, overrides } = useTargetContext() as {
        status?: { state?: string }
        overrides?: Overrides
    }

    const id = "OverridesPanel"

    // --- Spindle slider control ---
    const [spindleSlider, setSpindleSlider] = useState(100)
    const pendingTarget = useRef<number | null>(null)
    const commandQueue = useRef<string[]>([])
    const sendInterval = useRef<number | null>(null)



    const buildSpindleQueue = (from: number, to: number) => {
        let delta = to - from
        const sign = delta > 0 ? "+" : "-"
        let remaining = Math.abs(delta)

        const queue: string[] = []

        const tens = Math.floor(remaining / 10)
        const ones = remaining % 10

        if (ones <= 5) {
            // Caso normal: no overshoot
            for (let i = 0; i < tens; i++) {
                queue.push(`#SSO${sign}10#`)
            }
            for (let i = 0; i < ones; i++) {
                queue.push(`#SSO${sign}1#`)
            }
        } else {
            // Overshoot inteligente
            for (let i = 0; i < tens + 1; i++) {
                queue.push(`#SSO${sign}10#`)
            }
            const corrSign = sign === "+" ? "-" : "+"
            for (let i = 0; i < 10 - ones; i++) {
                queue.push(`#SSO${corrSign}1#`)
            }
        }

        return queue
    }



    const startSendingQueue = () => {
        if (sendInterval.current != null) {
            clearInterval(sendInterval.current)
            sendInterval.current = null
        }

        if (commandQueue.current.length === 0) return

        sendInterval.current = window.setInterval(() => {
            if (commandQueue.current.length === 0) {
                if (sendInterval.current != null) {
                    clearInterval(sendInterval.current)
                    sendInterval.current = null
                }
                return
            }

            const cmd = commandQueue.current.shift()
            if (cmd) {
                targetCommands(cmd)
            }
        }, 300)
    }
    useEffect(() => {
        if (overrides?.spindle == null) return

        // 🟢 No hay acción pendiente → el slider sigue al valor real
        if (pendingTarget.current == null) {
            setSpindleSlider(Math.min(200, Math.max(0, overrides.spindle)))
            return
        }

        // 🟠 Se terminó de enviar la cola pero NO se llegó al target
        // → snap al valor real y limpiar estado
        if (
            commandQueue.current.length === 0 &&
            overrides.spindle !== pendingTarget.current
        ) {
            setSpindleSlider(Math.min(200, Math.max(0, overrides.spindle)))
            pendingTarget.current = null
            return
        }

        // ✅ El firmware llegó exactamente al target
        // → limpiar estado (el slider ya está bien)
        if (overrides.spindle === pendingTarget.current) {
            pendingTarget.current = null
        }
    }, [overrides?.spindle])





    const buttons_list: ButtonsGroup[] = [
        {
            label: "CN67",
            buttons: [
                {
                    label: "-10%",
                    tooltip: "CN67",
                    command: "#SSO-10#",
                },
                {
                    label: "-1%",
                    tooltip: "CN67",
                    command: "#SSO-1#",
                },
                {
                    label: "100%",
                    tooltip: "CN66",
                    command: "#SSO100#",
                },
                {
                    iconRight: true,
                    label: "+1%",
                    tooltip: "CN67",
                    command: "#SSO+1#",
                },
                {
                    iconRight: true,
                    label: "+10%",
                    tooltip: "CN67",
                    command: "#SSO+10#",
                },
            ],
        },
        {
            label: "CN68",
            buttons: [
                {
                    label: "-10%",
                    tooltip: "CN68",
                    command: "#FO-10#",
                },
                {
                    label: "-1%",
                    tooltip: "CN68",
                    command: "#FO-1#",
                },
                {
                    label: "100%",
                    tooltip: "CN66",
                    command: "#FO100#",
                },
                {
                    iconRight: true,
                    label: "+1%",
                    tooltip: "CN68",
                    command: "#FO+1#",
                },
                {
                    iconRight: true,
                    label: "+10%",
                    tooltip: "CN68",
                    command: "#FO+10#",
                },
            ],
        },
        {
            label: "CN69",
            buttons: [
                {
                    label: "25%",
                    tooltip: "CN69",
                    command: "#RO25#",
                },
                {
                    label: "50%",
                    tooltip: "CN69",
                    command: "#RO50#",
                },
                {
                    label: "100%",
                    tooltip: "CN66",
                    command: "#RO100#",
                },
            ],
        },
    ]

    return (
        <div class="panel panel-dashboard" id={id}>
            <ContainerHelper id={id} />
            <div class="navbar">
                <span class="navbar-section feather-icon-container">
                    <Repeat />
                    <strong class="text-ellipsis">{T("CN65")}</strong>
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
                <OverridesControls />
                {buttons_list.map((item) => {

                    // 🟢 SPINDLE → SLIDER
                    if (item.label === "CN67") {
                        if (status?.state !== "Run" && status?.state !== "Hold") return null

                        return (
                            <fieldset
                                key={item.label}
                                class="fieldset-top-separator fieldset-bottom-separator field-group"
                            >
                                <legend>
                                    <label class="m-1 buttons-bar-label">
                                        {T(item.label)}
                                    </label>
                                </legend>

                                <div style="display:flex; justify-content:center; padding:16px;">
                                    <input
                                        type="range"
                                        min={50}
                                        max={150}
                                        step={1}
                                        value={spindleSlider}
                                        style="writing-mode: bt-lr; -webkit-appearance: slider-vertical; height:220px;"
                                        onInput={(e) => {
                                            setSpindleSlider(
                                                parseInt((e.target as HTMLInputElement).value)
                                            )
                                        }}
                                        onChange={() => {
                                            const from =
                                                pendingTarget.current != null
                                                    ? pendingTarget.current
                                                    : overrides?.spindle


                                            if (from == null) return
                                            if (spindleSlider === from) return   // ← ESTE

                                            pendingTarget.current = spindleSlider
                                            commandQueue.current = buildSpindleQueue(from, spindleSlider)
                                            startSendingQueue()
                                        }}

                                    />

                                </div>

                                <div style="display:flex; justify-content:center; gap:12px; margin-top:12px;">
                                    <ButtonImg
                                        label="100%"
                                        tooltip={T("CN66")}
                                        onClick={(e: TargetedMouseEvent<HTMLButtonElement>) => {
                                            useUiContextFn.haptic()
                                            e.currentTarget.blur()

                                            targetCommands("#SSO100#")

                                            // limpiar estado interno
                                            pendingTarget.current = null
                                            commandQueue.current = []
                                        }}
                                    />
                                </div>


                                <div style="text-align:center; font-weight:bold;">
                                    {spindleSlider} %
                                </div>
                            </fieldset>
                        )
                    }

                    // 🔵 FEED + RAPID → BOTONES (sin cambios)
                    return (
                        <fieldset
                            key={item.label}
                            class="fieldset-top-separator fieldset-bottom-separator field-group"
                        >
                            <legend>
                                <label class="m-1 buttons-bar-label">
                                    {T(item.label)}
                                </label>
                            </legend>

                            <div class="field-group-content maxwidth">
                                <div class="states-buttons-container">
                                    {item.buttons.map((button, index) => {
                                        return (
                                            <ButtonImg
                                                key={button.label}
                                                mt1
                                                className={
                                                    item.buttons.length / 2 > index
                                                        ? "tooltip tooltip-right"
                                                        : "tooltip tooltip-left"
                                                }
                                                label={T(button.label)}
                                                data-tooltip={T(button.tooltip)}
                                                onClick={(e: TargetedMouseEvent<HTMLButtonElement>) => {
                                                    useUiContextFn.haptic()
                                                    e.currentTarget.blur()
                                                    targetCommands(button.command)

                                                    if (button.command === "#SSO100#") {
                                                        pendingTarget.current = null
                                                        commandQueue.current = []
                                                    }

                                                }}
                                            />
                                        )
                                    })}
                                </div>
                            </div>
                        </fieldset>
                    )
                })}

                {(status?.state === "Run" || status?.state === "Hold") && (
                    <div style="display:flex; justify-content:center; margin-top:24px;">
                        <ButtonImg
                            icon={status.state === "Hold" ? <Play /> : <Pause />}
                            tooltip
                            data-tooltip={
                                status.state === "Hold"
                                    ? T("CN61")   // Cycle Start
                                    : T("Hold")
                            }
                            onClick={(e: TargetedMouseEvent<HTMLButtonElement>) => {
                                useUiContextFn.haptic()
                                e.currentTarget.blur()
                                targetCommands(
                                    status.state === "Hold"
                                        ? "#CYCLESTART#"
                                        : "#FEEDHOLD#"
                                )
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}

const OverridesPanelElement = {
    id: "OverridesPanel",
    content: <OverridesPanel />,
    name: "CN65",
    icon: "Repeat",
    show: "showoverridespanel",
    onstart: "openoverridesonstart",
    settingid: "overrides",
}

export { OverridesPanel, OverridesPanelElement, OverridesControls }
