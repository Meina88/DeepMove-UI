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

import type { FunctionalComponent } from "preact"
import { T } from "../Translations"
import { Play, Pause, Plus, Minus, RefreshCw } from "preact-feather"
import { Mixer } from "../../targets/CNC/FluidNC/icons"
import { useUiContextFn, useUiContext } from "../../contexts"
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
import { computeOverridesDisplay } from "./Overrides/overridesDisplay"
import { useOverrideCommands } from "./Overrides/useOverrideCommands"





const OverridesControls: FunctionalComponent<{
    linked: boolean
    setLinked: (v: boolean) => void
    isLaserMode: boolean
}> = ({ linked, setLinked, isLaserMode }) => {

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
                    {isLaserMode ? (
                        T("S346")
                    ) : (
                        T("S301")
                    )}
                </div>

            </div>
        </div>
    )

}

interface OverridesPanelProps {
    embedded?: boolean
}

const OverridesPanel: FunctionalComponent<OverridesPanelProps> = ({ embedded = false }) => {

    const { targetCommands } = useTargetCommands()
    const [linked, setLinked] = useState(false)

    const rpmMax = Number(useUiContextFn.getValue("rpm_max")) || 24000
    const feedMax = Number(useUiContextFn.getValue("feed_max")) || 5000
    const laserMaxPower = Number(useUiContextFn.getValue("laser_max_power")) || 255

    const { status, streamStatus, states } = useTargetContext()
    const { toolNumbers } = useUiContext()

    const {
        isLaserMode,
        canPause,
        canPlay,
        powerW,
        powerPct,
        powerLevel,
        spindleVal,
        feedVal,
        spindleAtMax,
        feedAtMax,
        spindleBarHeight,
        feedBarHeight,
        hasRunProgress,
        progressPct,
        progressVisiblePct,
    } = computeOverridesDisplay({
        status,
        streamStatus,
        states,
        laser: toolNumbers?.laser ?? null,
        rpmMax,
        feedMax,
        laserMaxPower,
    })

    const { uiSpindleOverride, uiFeedOverride, sendOverride } = useOverrideCommands(linked, targetCommands)

    const id = "OverridesPanel"
    const PROGRESS_GAUGE_LEN = 220

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
                <OverridesControls
                    linked={linked}
                    setLinked={setLinked}
                    isLaserMode={isLaserMode}
                />

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
                                <div class="graph-value-unit">
                                    {isLaserMode ? "PWR" : "RPM"}
                                </div>
                            </div>

                        </div>

                        {/* 🔋 POWER GAUGE */}


                        <div class="graph-center-gauge">

                            <div class="gauge-progress">
                                <div class="gauge-progress-label">{T("Progress")}:</div>
                                <div class="gauge-progress-value">
                                    {hasRunProgress ? `${progressPct}%` : "- %"}
                                </div>
                            </div>


                            <svg viewBox="0 0 200 120" class="power-gauge">

                                {/*       TRACK BASE (común) */}
                                {!isLaserMode && (
                                    <path
                                        d="M20 100 A80 80 0 0 1 180 100"
                                        class="gauge-track"
                                        fill="none"
                                    />
                                )}

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
                                {!isLaserMode && (
                                    <path
                                        d="M20 100 A80 80 0 0 1 180 100"
                                        class={`gauge-fill power-${powerLevel}`}
                                        fill="none"
                                        style={{
                                            strokeDasharray: 252,
                                            strokeDashoffset: 252 - powerPct * 2.52
                                        }}
                                    />
                                )}


                            </svg>


                            {!isLaserMode && (
                                <div class={`power-value power-${powerLevel}`}>
                                    {powerW} <span>W</span>
                                </div>
                            )}
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
                                isLaserMode ? "PWR" : "RPM"
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
                                T("S259")
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
