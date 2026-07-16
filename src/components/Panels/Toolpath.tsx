/*
 Toolpath.tsx - ESP3D WebUI custom panel
*/

import { FunctionalComponent } from "preact"
import { useCallback, useEffect, useRef, useState } from "preact/hooks"

import { T } from "../Translations"
import { ContainerHelper, FullScreenButton, CloseButton } from "../Controls"
import { Menu as PanelMenu } from "./"
import { Eye, CheckCircle, Circle } from "preact-feather"
import { useUiContextFn } from "../../contexts"
import { useTargetContext } from "../../targets"

import { eventBus } from "../../hooks/eventBus"
import { ClearPath, Frame } from "../../targets/CNC/FluidNC/icons"

import { Play, Pause } from "preact-feather"
import { ButtonImg } from "../Controls"
import { useTargetCommands } from "../../hooks"
import { files } from "../../targets"
import { espHttpURL } from "../Helpers/http"

import { detectGCodeType, GCodeBounds } from "../Toolpath/core/GCodeLaserDetector"
import { showModal } from "../Modal"
import { useModalsContext } from "../../contexts"
import { useUiContext } from "../../contexts"
import type { StateEntry } from "../../targets/types"
import type { CameraState } from "./Toolpath/cameraMath"
import { useToolpathViewPrefs, type ViewId } from "./Toolpath/useToolpathViewPrefs"
import { useCanvasRenderer } from "./Toolpath/useCanvasRenderer"
import { useToolpathCamera } from "./Toolpath/useToolpathCamera"
import { useToolPositionTracking } from "./Toolpath/useToolPositionTracking"
import { useToolpathFileEvents, type SelectedToolpathFile } from "./Toolpath/useToolpathFileEvents"
import { decidePlayAction } from "./Toolpath/decidePlayAction"


interface ToolpathPanelProps {
    embedded?: boolean
}


const ToolpathPanel: FunctionalComponent<ToolpathPanelProps> = ({ embedded: _embedded = false }) => {

    const id = "toolpathPanel"
    const showPanel = useUiContextFn.getValue("showtoolpathpanel")
    const { positions, status, states } = useTargetContext()
    const { modals } = useModalsContext()
    const { toolNumbers } = useUiContext()

    // active_tool is always a single entry (never an array) per how
    // getStates() populates it in filters.ts, unlike other dynamic
    // gcode-mode-based state keys.
    const currentTool = (states.active_tool as StateEntry | undefined)?.value

    const isLaserMode =
        toolNumbers?.laser != null &&
        currentTool != null &&
        Number(currentTool) === Number(toolNumbers.laser)
    const { targetCommands } = useTargetCommands()

    const [selectedFile, setSelectedFile] = useState<SelectedToolpathFile | null>(null)
    const [bounds, setBounds] = useState<GCodeBounds | null>(null)

    // NO retornar acá (así se montan los hooks y el listener)

    const {
        viewIndex,
        setViewIndex,
        showGrid,
        setShowGrid,
        enabledViews,
        setEnabledViews,
        visiblePresets,
    } = useToolpathViewPrefs()

    const [isRendering, setIsRendering] = useState(false)

    // 🔵 Toolhead
    const [toolPos, setToolPos] = useState<{ x: number; y: number; z: number } | null>(null)

    const { canvasRef, rendererRef, modelRef, ensureRenderer, renderCurrent } = useCanvasRenderer()

    // 🎥 Cámara (ZOOM / PAN): redraws the canvas whenever the camera changes.
    const onCameraChange = useCallback((camera: CameraState) => {
        renderCurrent(visiblePresets[viewIndex], camera, toolPos, showGrid)
    }, [renderCurrent, visiblePresets, viewIndex, toolPos, showGrid])

    const { cameraRef, resetCamera, hasMovedRef } = useToolpathCamera({
        canvasRef,
        onCameraChange,
    })

    // 🖱️ Click simple diferido (para distinguir double click)
    const clickTimeoutRef = useRef<number | null>(null)

    // 🔴 TOOL REAL — sigue WPos (igual que Jog: positions.wx/wy/wz suelen ser strings)
    useToolPositionTracking(positions, setToolPos)

    // 🔁 Redraw
    useEffect(() => {
        renderCurrent(visiblePresets[viewIndex], cameraRef.current, toolPos, showGrid)
    }, [viewIndex, toolPos, showGrid, visiblePresets, renderCurrent, cameraRef])

    // 📐 Resize
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        ensureRenderer()

        const resize = () => {
            const rect = canvas.getBoundingClientRect()
            const dpr = window.devicePixelRatio || 1

            canvas.width = Math.max(1, Math.floor(rect.width * dpr))
            canvas.height = Math.max(1, Math.floor(rect.height * dpr))

            const ctx = canvas.getContext("2d")
            if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

            renderCurrent(visiblePresets[viewIndex], cameraRef.current, toolPos, showGrid)
        }

        resize()

        const ro = new ResizeObserver(resize)
        ro.observe(canvas)

        window.addEventListener("resize", resize)

        return () => {
            ro.disconnect()
            window.removeEventListener("resize", resize)
        }
    }, [viewIndex, toolPos, showGrid, visiblePresets, canvasRef, cameraRef, ensureRenderer, renderCurrent])

    useToolpathFileEvents({
        viewIndex,
        visiblePresets,
        showGrid,
        canvasRef,
        rendererRef,
        modelRef,
        cameraRef,
        renderCurrent,
        setSelectedFile,
        setBounds,
        setToolPos,
        setIsRendering,
    })

    const checkFileModeAndRun = async (
        url: string,
        filename: string,
        runCmd: string
    ) => {
        try {
            const response = await fetch(url)
            const text = await response.text()

            const type = detectGCodeType(text)

            const mismatch =
                (type === "LASER" && !isLaserMode) ||
                (type === "CNC" && isLaserMode)

            if (mismatch) {
                showModal({
                    modals,
                    id: "wrongModeModal",
                    title: T("Warning"),
                    content: (
                        <div>
                            {type === "LASER"
                                ? "This file was generated for LASER machining. Switch to LASER mode to execute it."
                                : "This file was generated for CNC machining. Switch to CNC mode to execute it."
                            }
                        </div>
                    ),
                    button2: { text: T("S28") }
                })

                return
            }

            targetCommands(runCmd)

        } catch (e) {
            console.warn("GCode detection failed", e)
            targetCommands(runCmd)
        }
    }

    const { canPause, canResume, canRunFile, canPlay, isHold } = decidePlayAction(status, !!selectedFile)

    return (
        <div
            class="panel panel-dashboard"
            id={id}
            style={!showPanel ? { display: "none" } : undefined}
        >

            <ContainerHelper id={id} />


            <div class="navbar">
                {/* IZQUIERDA: título + clear */}
                <span class="navbar-section">
                    <span class="feather-icon-container">
                        <Eye />
                    </span>
                    <strong
                        class="text-ellipsis"
                        style={{ marginLeft: "0.4rem", cursor: "default" }}
                    >
                        {T("S304")}
                    </strong>
                </span>


                <div
                    style={{
                        position: "relative",
                        zIndex: 5,
                        pointerEvents: "auto",
                        marginRight: "0.5rem",
                    }}
                >
                    <button
                        class="btn btn-sm btn-error"
                        title={T("S306")}
                        onClick={() => eventBus.emit("toolpath:reset", null)}
                        style={{
                            marginRight: "0.2rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transform: "rotate(180deg) scaleX(-1)",
                            padding: "0.35rem",   // opcional, ajusta el “aire”
                        }}
                    >
                        <ClearPath height="1.3em" />
                    </button>

                </div>



                {/* DERECHA: menú + fullscreen + close */}
                <span class="navbar-section">
                    <span class="full-height">
                        <PanelMenu
                            items={[
                                {
                                    label: T("S305"),
                                    displayToggle: () => (
                                        <span class="feather-icon-container">
                                            {showGrid ? (
                                                <CheckCircle style={{ width: "0.8rem", height: "0.8rem" }} />
                                            ) : (
                                                <Circle style={{ width: "0.8rem", height: "0.8rem" }} />
                                            )}
                                        </span>
                                    ),
                                    onClick: () => setShowGrid(v => !v),
                                },

                                ...(["top", "oblique", "front", "side"] as ViewId[]).map(id => ({
                                    label:
                                        id === "top"
                                            ? T("S307")
                                            : id === "oblique"
                                                ? T("S310")
                                                : id === "front"
                                                    ? T("S308")
                                                    : T("S309"),

                                    displayToggle: () => (
                                        <span class="feather-icon-container">
                                            {enabledViews.includes(id) ? (
                                                <CheckCircle style={{ width: "0.8rem", height: "0.8rem" }} />
                                            ) : (
                                                <Circle style={{ width: "0.8rem", height: "0.8rem" }} />
                                            )}
                                        </span>
                                    ),

                                    onClick: () =>
                                        setEnabledViews(v =>
                                            v.includes(id)
                                                ? v.filter(x => x !== id)
                                                : [...v, id]
                                        ),
                                })),
                            ]}
                        />

                        <FullScreenButton elementId={id} />
                        <CloseButton elementId={id} hideOnFullScreen={true} />
                    </span>
                </span>
            </div>


            <div
                class="panel-body panel-body-dashboard m-2"
                style={{ position: "relative" }}
            >
                <canvas
                    ref={canvasRef}
                    style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "6px",
                        touchAction: "none",
                    }}

                    onClick={() => {
                        if (hasMovedRef.current) return

                        // esperar por si viene un segundo click
                        if (clickTimeoutRef.current) {
                            clearTimeout(clickTimeoutRef.current)
                            clickTimeoutRef.current = null
                        }

                        clickTimeoutRef.current = window.setTimeout(() => {
                            setViewIndex(v => (v + 1) % visiblePresets.length)
                            clickTimeoutRef.current = null
                        }, 250)
                    }}

                    onDblClick={(e) => {
                        e.preventDefault()

                        // cancelar click simple pendiente
                        if (clickTimeoutRef.current) {
                            clearTimeout(clickTimeoutRef.current)
                            clickTimeoutRef.current = null
                        }

                        resetCamera()
                    }}
                />
                {/* ▶ START / HOLD (overlay inferior centrado) */}
                <div class="toolpath-starthold-container">

                    {canPause && (
                        <ButtonImg
                            class={`override-hold-btn is-hold is-active`}
                            icon={<Pause size={22} />}
                            tooltip

                            onClick={() => {
                                useUiContextFn.haptic()
                                targetCommands("#FEEDHOLD#")
                            }}
                        />

                    )}

                    {!canPause && (
                        <ButtonImg
                            class={`override-hold-btn is-play ${isHold ? "is-active" : ""} ${!canPlay ? "is-disabled" : ""}`}
                            icon={<Play size={22} />}
                            tooltip

                            onClick={() => {

                                if (!canPlay) return

                                useUiContextFn.haptic()

                                // 🔴 CASO 1: RESUME
                                if (canResume) {
                                    targetCommands("#CYCLESTART#")
                                    return
                                }

                                // 🔵 CASO 2: RUN FILE
                                if (canRunFile && selectedFile) {

                                    eventBus.emit("hmi:play", null)

                                    const isMobile = window.innerWidth <= 768

                                    if (isMobile) {
                                        document
                                            .getElementById("OverridesPanel")
                                            ?.scrollIntoView({ behavior: "smooth", block: "start" })
                                    }

                                    const previewOnRun = isMobile
                                        ? useUiContextFn.getValue("filesPreviewOnPlayMobile")
                                        : useUiContextFn.getValue("filesPreviewOnPlayDesktop")

                                    const cmd = files.command(
                                        selectedFile.fs,
                                        "play",
                                        selectedFile.path,
                                        selectedFile.filename
                                    )

                                    const dl = files.command(
                                        selectedFile.fs,
                                        "download",
                                        selectedFile.path,
                                        selectedFile.filename
                                    )

                                    const url = espHttpURL(dl.url, dl.args)

                                    eventBus.emit("toolpath:reset", null)

                                    if (previewOnRun) {

                                        eventBus.emit("toolpath:preview", {
                                            url,
                                            filename: selectedFile.filename,
                                        })

                                        setTimeout(() => {
                                            checkFileModeAndRun(url, selectedFile.filename, cmd.cmd)
                                        }, 150)

                                    } else {

                                        checkFileModeAndRun(url, selectedFile.filename, cmd.cmd)
                                    }
                                }
                            }}
                        />
                    )}

                </div>
                {/* 🔲 FRAME BUTTON (Laser only) */}
                {isLaserMode && bounds && (
                    <div class="toolpath-frame-container">
                        <ButtonImg
                            icon={<Frame height="1.1em" />}
                            label=""
                            className="override-hold-btn frame-btn"
                            onClick={() => {

                                const { xmin, xmax, ymin, ymax } = bounds

                                useUiContextFn.haptic()

                                const focusPercent = Number(useUiContextFn.getValue("laserfocuspower") ?? 5)
                                const maxS = Number(useUiContextFn.getValue("laser_max_power") ?? 1000)
                                const focusS = Math.round(maxS * focusPercent / 100)

                                targetCommands("G90")
                                targetCommands("G21")

                                targetCommands(`M3 S${focusS}`)
                                targetCommands("G1 F1500")

                                targetCommands(`X${xmin} Y${ymin}`)
                                targetCommands(`X${xmax} Y${ymin}`)
                                targetCommands(`X${xmax} Y${ymax}`)
                                targetCommands(`X${xmin} Y${ymax}`)
                                targetCommands(`X${xmin} Y${ymin}`)

                                targetCommands("M5 S0")
                                targetCommands("G0")
                            }}
                        />
                    </div>
                )}
                {/* ▶ RUN FILE (nuevo botón separado) */}


                {isRendering && (
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: "rgba(0,0,0,0,0,0)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 10,
                            borderRadius: "6px",
                            pointerEvents: "none",
                            color: "#fff",
                            fontSize: "14px",
                            letterSpacing: "0.5px",
                        }}
                    >
                        ⏳
                    </div>
                )}
            </div>


        </div>
    )
}

const ToolpathPanelElement = {
    id: "toolpathPanel",
    content: <ToolpathPanel />,
    name: "S304",
    icon: "Eye",
    show: "showtoolpathpanel",
    onstart: "opentoolpathonstart",
    settingid: "toolpath",
}

export { ToolpathPanel, ToolpathPanelElement }
