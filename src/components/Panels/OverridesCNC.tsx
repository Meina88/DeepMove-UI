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
import type { FunctionalComponent } from "preact"
import { T } from "../Translations"
import { Repeat, Play, Pause } from "preact-feather"
import { useUiContextFn } from "../../contexts"
import { useTargetContext } from "../../targets"
import {
    ButtonImg,
    FullScreenButton,
    CloseButton,
    ContainerHelper,
} from "../Controls"
import { useTargetCommands } from "../../hooks"
import { Lock, Unlock } from "preact-feather"
import { useState } from "preact/hooks"



type StateValue = { value: string } | Array<{ value: string }>
type StatesMap = Record<string, StateValue>

const OverridesControls: FunctionalComponent<{
    linked: boolean
    setLinked: (v: boolean) => void
}> = ({ linked, setLinked }) => {

    if (!useUiContextFn.getValue("showoverridespanel")) return null

    return (
        <div class="status-ctrls center-only">
            <ButtonImg
                icon={linked ? <Lock /> : <Unlock />}
                tooltip
                data-tooltip={
                    linked
                        ? "Feed & Spindle linked"
                        : "Feed & Spindle independent"
                }
                onClick={() => {
                    useUiContextFn.haptic()
                    setLinked(!linked)
                }}
            />
        </div>
    )
}



const OverridesPanel: FunctionalComponent = () => {
    const [uiSpindleOverride, setUiSpindleOverride] = useState(100)
    const [uiFeedOverride, setUiFeedOverride] = useState(100)
    const { targetCommands } = useTargetCommands()
    const [linked, setLinked] = useState(false)
    const { status, streamStatus, states } = useTargetContext() as {
        status?: { state?: string }
        streamStatus?: {
            name?: string
            processed?: number
            total?: number
        }
        states?: StatesMap
    }

    const id = "OverridesPanel"



    const spindle = states?.spindle_speed
    const feed = states?.feed_rate
    /* Valores reales (string) */
    const spindleVal = spindle
        ? Array.isArray(spindle)
            ? spindle.map(i => i.value).join(" ")
            : spindle.value
        : "--"

    const feedVal = feed
        ? Array.isArray(feed)
            ? feed.map(i => i.value).join(" ")
            : feed.value
        : "--"

    /* Valores reales (number) */
    const spindleRPM = Number(spindleVal) || 0
    const feedMM = Number(feedVal) || 0

    /* Normalización 50–150 → 0–100% */
    const overrideToHeight = (value: number) => {
        const MIN = 50
        const MAX = 150
        const clamped = Math.max(MIN, Math.min(MAX, value))
        return ((clamped - MIN) / (MAX - MIN)) * 100
    }
    const spindleBarHeight =
        spindleRPM > 0
            ? overrideToHeight(uiSpindleOverride)
            : 0

    const feedBarHeight =
        feedMM > 0
            ? overrideToHeight(uiFeedOverride)
            : 0





    const spindleButtons = [
        { label: "+10%", tooltip: "CN67", delta: "+10" as const },
        { label: "100%", tooltip: "CN66", delta: "100" as const },
        { label: "-10%", tooltip: "CN67", delta: "-10" as const },
    ]

    const feedButtons = [
        { label: "+10%", tooltip: "CN68", delta: "+10" as const },
        { label: "100%", tooltip: "CN66", delta: "100" as const },
        { label: "-10%", tooltip: "CN68", delta: "-10" as const },
    ]


    type OverrideType = "spindle" | "feed"
    type OverrideDelta = "+10" | "-10" | "100"

    const clamp = (v: number) => Math.max(50, Math.min(150, v))

    const sendOverride = (type: OverrideType, delta: OverrideDelta) => {
        const applyDelta = (current: number) => {
            if (delta === "100") return 100
            if (delta === "+10") return Math.min(150, current + 10)
            if (delta === "-10") return Math.max(50, current - 10)
            return current
        }

        if (!linked) {
            if (type === "spindle") {
                setUiSpindleOverride(v => applyDelta(v))
                targetCommands(`#SSO${delta}#`)
            } else {
                setUiFeedOverride(v => applyDelta(v))
                targetCommands(`#FO${delta}#`)
            }
            return
        }

        // 🔒 linked
        setUiSpindleOverride(v => applyDelta(v))
        setUiFeedOverride(v => applyDelta(v))
        targetCommands(`#SSO${delta}#`)
        targetCommands(`#FO${delta}#`)
    }





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
                        <FullScreenButton elementId={id} />
                        <CloseButton
                            elementId={id}
                            hideOnFullScreen={true}
                        />
                    </span>
                </span>
            </div>




            <div class="panel-body panel-body-dashboard">
                <OverridesControls linked={linked} setLinked={setLinked} />

                <div class="overrides-top-placeholder">

                    {/* 🔼 GRÁFICOS DE SPEED / FEED */}
                    <div class="overrides-graphs">

                        {/* SPINDLE */}
                        <div class="graph-column">
                            <div class="graph-bar spindle">
                                <div
                                    class="graph-bar-fill"
                                    style={{
                                        height: `${spindleBarHeight}%`
                                        ,

                                    }}

                                />
                            </div>
                            <div class="graph-value">
                                <div class="graph-value-number">{spindleVal || "--"}</div>
                                <div class="graph-value-unit">rpm</div>
                            </div>

                        </div>

                        {/* ESPACIO CENTRAL RESERVADO */}
                        <div class="graph-center-space" />

                        {/* FEED */}
                        <div class="graph-column">
                            <div class="graph-bar feed">
                                <div
                                    class="graph-bar-fill"
                                    style={{
                                        height: `${feedBarHeight}%`
                                        ,
                                    }}

                                />
                            </div>
                            <div class="graph-value">
                                {feedVal || "--"} mm/min
                            </div>
                        </div>

                    </div>

                    {/* ⬇️ Indicador de archivo y progreso (FOOTER) */}
                    <div class={`graph-footer ${status?.state === "Run" ? "visible" : "hidden"}`}>
                        <div class="graph-file-name text-ellipsis">
                            {streamStatus?.name || ""}
                        </div>

                        <div class="graph-progress">
                            {status?.state === "Run" && streamStatus?.total
                                ? `${(
                                    (Number(streamStatus.processed) /
                                        Number(streamStatus.total)) *
                                    100
                                ).toFixed(1)}%`
                                : ""}
                        </div>
                    </div>


                </div>



                {/* Spindle buttons */}
                <div class="field-group-content maxwidth spindle">
                    <div class="states-buttons-container">
                        {spindleButtons.map((button) => (
                            <ButtonImg
                                key={button.label}
                                mt1
                                label={T(button.label)}
                                data-tooltip={T(button.tooltip)}
                                onClick={(e: TargetedMouseEvent<HTMLButtonElement>) => {
                                    useUiContextFn.haptic()
                                    e.currentTarget.blur()
                                    sendOverride("spindle", button.delta)
                                }}
                            />
                        ))}


                    </div>
                </div>

                {/* ⏸️ / ▶️ HOLD – START (CENTRO INFERIOR) */}
                <div class="override-buttons-container">
                    {[
                        {
                            cmd: "#FEEDHOLD#",
                            icon: <Pause />,
                            desc: T("Hold"),
                            depend: [
                                "Door",
                                "Sleep",
                                "Alarm",
                                "Error",
                                "Check",
                                "Run",
                                "Idle",
                                "Home",
                                "Jog",
                                "Tool",
                                "?",
                            ],
                        },
                        {
                            cmd: "#CYCLESTART#",
                            icon: <Play />,
                            desc: T("CN61"),
                            depend: ["Hold", "Tool"],
                        },
                    ].map((button) => {
                        if (
                            button.depend &&
                            !button.depend.includes(status?.state || "")
                        ) {
                            return null
                        }

                        return (
                            <ButtonImg
                                key={button.cmd}
                                icon={button.icon}
                                tooltip
                                data-tooltip={button.desc}
                                onClick={() => {
                                    useUiContextFn.haptic()
                                    targetCommands(button.cmd)
                                }}
                            />
                        )
                    })}
                </div>


                {/* Feed buttons */}
                <div class="field-group-content maxwidth feed">
                    <div class="states-buttons-container">
                        {feedButtons.map((button) => (
                            <ButtonImg
                                key={button.label}
                                mt1
                                label={T(button.label)}
                                data-tooltip={T(button.tooltip)}
                                onClick={(e: TargetedMouseEvent<HTMLButtonElement>) => {
                                    useUiContextFn.haptic()
                                    e.currentTarget.blur()
                                    sendOverride("feed", button.delta)
                                }}
                            />
                        ))}
                    </div>
                </div>

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
