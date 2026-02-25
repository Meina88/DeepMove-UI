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
import { Play, Pause, Plus, Minus, RefreshCw } from "preact-feather"
import { Mixer } from "../../targets/CNC/FluidNC/icons"
import { useUiContextFn } from "../../contexts"
import { useTargetContext } from "../../targets"
import {
    ButtonImg,
    Button,
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
            <div class="lock-control">

                <div class="link-switch-wrap">
                    {/* 🔓 UNLOCK */}
                    <Unlock size={12} class={`link-switch-icon ${!linked ? "active" : ""}`} />

                    {/* SWITCH */}
                    <div
                        class={`link-switch ${linked ? "is-on" : ""}`}
                        role="switch"
                        aria-checked={linked}
                        title={
                            linked
                                ? T("Feed & Spindle linked")
                                : T("Feed & Spindle independent")
                        }
                        onClick={() => {
                            useUiContextFn.haptic()
                            setLinked(!linked)
                        }}
                    >
                        <div class="link-switch-thumb" />
                    </div>

                    {/* 🔒 LOCK */}
                    <Lock size={12} class={`link-switch-icon ${linked ? "active" : ""}`} />
                </div>



                <div class="lock-label">
                    {T("Chipload")}
                </div>

            </div>
        </div>
    )

}

interface OverridesPanelProps {
    embedded?: boolean
}

const OverridesPanel: FunctionalComponent<OverridesPanelProps> = ({ embedded = false }) => {

    const [uiSpindleOverride, setUiSpindleOverride] = useState(100)
    const [uiFeedOverride, setUiFeedOverride] = useState(100)
    const { targetCommands } = useTargetCommands()
    const [linked, setLinked] = useState(false)

    const rpmMax = Number(useUiContextFn.getValue("rpm_max")) || 24000
    const feedMax = Number(useUiContextFn.getValue("feed_max")) || 5000
    const { status, streamStatus, states } = useTargetContext() as {

        status?: {
            state?: string
            power?: { value: number }
            [key: string]: any
        }


        streamStatus?: {
            name?: string
            processed?: number
            total?: number
        }
        states?: StatesMap
    }

    const canResumeFromDoor =
        status?.state === "Door" && status?.substate === 0

    const isRun = status?.state === "Run"
    const isHold = status?.state === "Hold"

    const canPause = isRun
    const canPlay = isHold || canResumeFromDoor


    const powerW = status?.power?.value ?? 0
    const id = "OverridesPanel"
    const MAX_POWER_W = 1500
    const powerPct = Math.min((powerW / MAX_POWER_W) * 100, 100)

    let powerLevel: "low" | "mid" | "high" = "low"

    if (powerPct >= 70) {
        powerLevel = "high"
    } else if (powerPct >= 40) {
        powerLevel = "mid"
    }





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


    // 🔒 Bloquear si el próximo +10% excede el límite
    const spindleNextRPM = spindleRPM * 1.1
    const feedNextMM = feedMM * 1.1

    const spindleAtMax = spindleNextRPM > rpmMax
    const feedAtMax = feedNextMM > feedMax

    const valueToHeight = (value: number, max: number) => {
        if (value <= 0) return 0
        const clamped = Math.min(value, max)
        return (clamped / max) * 100
    }

    const spindleBarHeight = valueToHeight(spindleRPM, rpmMax)
    const feedBarHeight = valueToHeight(feedMM, feedMax)







    // ===============================
    // Progress bar (RUN)
    // ===============================
    const hasRunProgress =
        (status?.state === "Run" || status?.state === "Hold") &&
        streamStatus?.processed !== undefined

    const progressPct = (() => {
        if (!hasRunProgress) return 0

        const processed = Number(streamStatus?.processed ?? 0)

        // Caso normal: processed/total
        if (streamStatus?.total) {
            const total = Number(streamStatus.total) || 0
            if (total <= 0) return 0
            return Math.max(
                0,
                Math.min(100, Math.round((processed / total) * 100))
            )
        }

        // Caso alternativo: processed ya viene en %
        return Math.max(0, Math.min(100, Math.round(processed)))
    })()



    const progressVisiblePct = Math.max(progressPct, 1)
    const progressRemainingPct = 100 - progressPct

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

    const POWER_GAUGE_LEN = 252
    const PROGRESS_GAUGE_LEN = 220

    // Offsets calculados (0–100%)
    const powerStrokeOffset =
        POWER_GAUGE_LEN * (1 - powerPct / 100)

    const progressStrokeOffset =
        PROGRESS_GAUGE_LEN * (1 - progressPct / 100)



    return (
        <div class="panel panel-dashboard" id={id}>
            <ContainerHelper id={id} />
            {!embedded && (
                <div class="navbar">
                    <span class="navbar-section feather-icon-container">
                        <Mixer />
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
            )}



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
                                        height: `${spindleBarHeight}%`,
                                    }}
                                />

                            </div>
                            <div class="graph-value">
                                <div class="graph-value-number">{spindleVal || "--"}</div>
                                <div class="graph-value-unit">rpm</div>
                            </div>

                        </div>

                        {/* 🔋 POWER GAUGE */}
                        <div class="graph-center-gauge">

                            {hasRunProgress && (
                                <div class="gauge-progress">
                                    <div class="gauge-progress-label">Progress</div>
                                    <div class="gauge-progress-value">{progressPct}%</div>
                                </div>

                            )}


                            <svg viewBox="0 0 200 120" class="power-gauge">

                                {/*       TRACK BASE (común) */}
                                <path
                                    d="M20 100 A80 80 0 0 1 180 100"
                                    class="gauge-track"
                                    fill="none"
                                />

                                {/*       PROGRESO (INTERNO)      Se vacía con el avance     =*/}
                                {hasRunProgress && (
                                    <path
                                        d="M35 100 A65 65 0 0 1 165 100"
                                        class="gauge-progress-fill"
                                        fill="none"
                                        style={{
                                            strokeDasharray: PROGRESS_GAUGE_LEN,
                                            strokeDashoffset:
                                                PROGRESS_GAUGE_LEN * (1 - progressVisiblePct / 100)
                                        }}
                                    />

                                )}

                                {/*       POTENCIA (EXTERNO)      */}
                                <path
                                    d="M20 100 A80 80 0 0 1 180 100"
                                    class={`gauge-fill power-${powerLevel}`}
                                    fill="none"
                                    style={{
                                        strokeDasharray: 252,
                                        strokeDashoffset: 252 - powerPct * 2.52
                                    }}
                                />


                            </svg>

                            <div class={`power-value power-${powerLevel}`}>
                                {powerW} <span>W</span>
                            </div>


                        </div>



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
                                <div class="graph-value-number">{feedVal || "--"}</div>
                                <div class="graph-value-unit">mm/min</div>
                            </div>

                        </div>

                    </div>


                    {/* Archivo en ejecución */}
                    {streamStatus?.name && (
                        <div class="run-file-name">
                            {streamStatus.name.split("/").pop()}
                        </div>
                    )}




                </div>



                {/* Spindle buttons */}
                <div class="field-group-content maxwidth spindle">
                    <div class="override-column-label">

                    </div>

                    <div class="override-rocker">

                        {/* +10% */}
                        <Button
                            class={`rocker-btn rocker-plus ${spindleAtMax ? "is-disabled" : ""}`}
                            disabled={spindleAtMax}
                            onClick={() => {
                                if (spindleAtMax) return
                                useUiContextFn.haptic()
                                sendOverride("spindle", "+10")
                            }}
                        >
                            <Plus size={18} />
                        </Button>

                        {/* SPEED = RESET 100% */}
                        <Button
                            class="rocker-label-btn"
                            onClick={() => {
                                if (uiSpindleOverride !== 100) {
                                    useUiContextFn.haptic()
                                    sendOverride("spindle", "100")
                                }
                            }}
                        >
                            {uiSpindleOverride === 100 ? (
                                "RPM"
                            ) : (
                                <RefreshCw size={16} />
                            )}
                        </Button>



                        {/* -10% */}
                        <Button
                            class="rocker-btn rocker-minus"
                            onClick={() => {
                                useUiContextFn.haptic()
                                sendOverride("spindle", "-10")
                            }}
                        >
                            <Minus size={18} />
                        </Button>

                    </div>

                </div>



                {/* ⏸️ / ▶️ HOLD – START (CENTRO INFERIOR) */}


                <div class="override-buttons-container">

                    {/* ⏸️ PAUSE — solo en Run */}
                    {canPause && (
                        <ButtonImg
                            class="override-hold-btn is-hold"
                            icon={<Pause size={22} />}
                            tooltip
                            data-tooltip={T("Hold")}
                            onClick={() => {
                                useUiContextFn.haptic()
                                targetCommands("#FEEDHOLD#")
                            }}
                        />
                    )}

                    {/* ▶️ PLAY — siempre visible */}
                    {!canPause && (
                        <ButtonImg
                            class={`override-hold-btn is-play ${!canPlay ? "is-disabled" : ""}`}
                            icon={<Play size={22} />}
                            tooltip
                            data-tooltip={
                                canPlay
                                    ? T("CN61")
                                    : T("Action not available")
                            }
                            onClick={() => {
                                if (!canPlay) return
                                useUiContextFn.haptic()
                                targetCommands("#CYCLESTART#")
                            }}
                        />
                    )}

                </div>







                {/* Feed buttons */}
                <div class="field-group-content maxwidth feed">

                    <div class="override-column-label">

                    </div>


                    <div class="override-rocker">

                        {/* +10% */}
                        <Button
                            class={`rocker-btn rocker-plus ${feedAtMax ? "is-disabled" : ""}`}
                            disabled={feedAtMax}
                            onClick={() => {
                                if (feedAtMax) return
                                sendOverride("feed", "+10")
                            }}
                        >
                            <Plus size={18} />
                        </Button>

                        {/* FEED = RESET 100% */}
                        <Button
                            class="rocker-label-btn"
                            onClick={() => {
                                if (uiFeedOverride !== 100) {
                                    useUiContextFn.haptic()
                                    sendOverride("feed", "100")
                                }
                            }}
                        >
                            {uiFeedOverride === 100 ? (
                                "FEED"
                            ) : (
                                <RefreshCw size={16} />
                            )}
                        </Button>



                        {/* -10% */}
                        <Button
                            class="rocker-btn rocker-minus"
                            onClick={() => {
                                useUiContextFn.haptic()
                                sendOverride("feed", "-10")
                            }}
                        >
                            <Minus size={18} />
                        </Button>

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
    icon: "Mixer",
    show: "showoverridespanel",
    onstart: "openoverridesonstart",
    settingid: "overrides",
}

export { OverridesPanel, OverridesPanelElement, OverridesControls }
