/*
 useToolpathFileEvents.ts - wires the toolpath viewer to the eventBus pipeline
 that drives it: "toolpath:selectedFile" (Files panel selection),
 "toolpath:preview" (download + parse + render a G-code file) and
 "toolpath:reset" (clear the current model/camera).
*/
import { useRef, useEffect } from "preact/hooks"
import { useUiContextFn } from "../../../contexts"
import { CanvasRenderer } from "../../Toolpath"
import { ToolpathModel } from "../../Toolpath/core/ToolpathModel"
import { ModalInterpreter } from "../../Toolpath/core/ModalInterpreter"
import { detectGCodeType, GCodeBounds } from "../../Toolpath/core/GCodeLaserDetector"
import { httpAdapter } from "../../../adapters/httpAdapter"
import { eventBus } from "../../../hooks/eventBus"
import type { ViewPreset } from "../../Toolpath/types/toolpath.types"
import type { CameraState } from "./cameraMath"
import { resetCamera as resetCameraState } from "./cameraMath"

interface ToolPosition {
    x: number
    y: number
    z: number
}

interface UseToolpathFileEventsParams {
    viewIndex: number
    visiblePresets: ViewPreset[]
    showGrid: boolean
    canvasRef: { current: HTMLCanvasElement | null }
    rendererRef: { current: CanvasRenderer | null }
    modelRef: { current: ToolpathModel | null }
    cameraRef: { current: CameraState }
    renderCurrent: (view: ViewPreset, camera: CameraState, toolPos: ToolPosition | null | undefined, showGrid?: boolean) => void
    setSelectedFile: (file: any) => void
    setBounds: (bounds: GCodeBounds | null) => void
    setToolPos: (pos: ToolPosition | null) => void
    setIsRendering: (rendering: boolean) => void
}

export function useToolpathFileEvents({
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
}: UseToolpathFileEventsParams): void {
    // Declared for a previous animation-frame based rendering path; nothing in
    // this file assigns it anymore, so these checks are currently always
    // false. Left in place (not removed) to keep this a pure move; safe to
    // clean up separately once confirmed truly dead.
    const rafRef = useRef<number | null>(null)

    // Unique per mounted instance: eventBus.on()/off() key subscriptions by a
    // plain id, and off() removes whatever is currently registered under that
    // id regardless of who put it there. A fixed literal id (the previous
    // "toolpath-selected"/"toolpath-preview"/"toolpath-reset") is shared by
    // every ToolpathPanel instance, so when two instances briefly overlap
    // (e.g. HMI's embedded panel mounting right before the dashboard's own
    // unmounts), the second mount's on() silently replaces the first's
    // listener, and the first's later off() (same fixed id) then deletes the
    // *second* instance's listener - leaving the surviving instance with no
    // listener at all. Scoping the id per instance makes on()/off() only ever
    // touch this instance's own registration.
    const instanceId = useRef(`toolpath-${Math.random().toString(36).slice(2)}`)

    useEffect(() => {
        const id = eventBus.on(
            "toolpath:selectedFile",
            (data) => {
                setSelectedFile(data)
            },
            `${instanceId.current}-selected`
        )

        return () => eventBus.off("toolpath:selectedFile", id)
        // setSelectedFile is a useState setter (stable); mount-only subscription.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        const listenerId = eventBus.on(
            "toolpath:preview",
            async (data: { url: string; filename: string }) => {

                console.log("📩 toolpath:preview", data)

                try {
                    eventBus.emit("openpanel", "toolpathPanel")
                    setIsRendering(true)

                    // cancelar animación previa
                    if (rafRef.current) {
                        cancelAnimationFrame(rafRef.current)
                        rafRef.current = null
                    }

                    // ─────────────────────────────
                    // 🔽 DESCARGA DEL G-CODE
                    // ─────────────────────────────

                    const res = await httpAdapter(data.url, {
                        method: "GET",
                        id: "download-toolpath-preview",
                    })

                    const result = await res.response
                    const gcodeText =
                        typeof result === "string"
                            ? result
                            : await result.text()
                    // ─────────────────────────────
                    // 🔽 PARSE DEL TOOLPATH
                    // ─────────────────────────────

                    const model = new ToolpathModel()

                    const isSmallScreen = window.innerWidth <= 768
                    const maxSegments = isSmallScreen
                        ? useUiContextFn.getValue("toolpathMaxSegmentsMobile")
                        : useUiContextFn.getValue("toolpathMaxSegmentsDesktop")

                    new ModalInterpreter(model, {
                        maxSegments: Number(maxSegments) || undefined,
                    }).parse(gcodeText)

                    modelRef.current = model

                    // 🔍 Detectar tipo + bounds
                    // Los bounds se derivan del bbox ya calculado por ModalInterpreter,
                    // que respeta G90/G91 (absoluto/relativo), G20/G21 (pulgadas/mm) y
                    // offsets G92 — a diferencia de un cálculo por regex sobre el texto
                    // crudo, que asumía todo X/Y como absoluto en mm.
                    const type = detectGCodeType(gcodeText)

                    if (type === "LASER" && model.segments.length > 0) {
                        const { minX, maxX, minY, maxY } = model.bbox
                        setBounds({
                            xmin: minX,
                            xmax: maxX,
                            ymin: minY,
                            ymax: maxY,
                            width: maxX - minX,
                            height: maxY - minY,
                        })
                    } else {
                        setBounds(null)
                    }

                    const first = model.segments[0]
                    setToolPos(first ? { ...first.start } : null)

                    // ─────────────────────────────
                    // 🎨 RENDER INICIAL
                    // ─────────────────────────────

                    const canvas = canvasRef.current
                    if (!canvas) return

                    if (!rendererRef.current) {
                        rendererRef.current = new CanvasRenderer(canvas)

                        const rect = canvas.getBoundingClientRect()
                        const dpr = window.devicePixelRatio || 1
                        canvas.width = Math.max(1, Math.floor(rect.width * dpr))
                        canvas.height = Math.max(1, Math.floor(rect.height * dpr))

                        const ctx = canvas.getContext("2d")
                        if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
                    }

                    // showGrid intentionally omitted here: CanvasRenderer.render defaults
                    // it to `true`, so the very first frame after loading a file always
                    // shows the grid regardless of the user's preference - a pre-existing
                    // quirk, preserved as-is (the very next redraw effect run, triggered by
                    // the toolPos state update above, immediately corrects it).
                    renderCurrent(
                        visiblePresets[viewIndex],
                        cameraRef.current,
                        first ? { ...first.start } : undefined
                    )

                    setIsRendering(false)

                } catch (err) {
                    console.error("Toolpath preview error:", err)
                    setIsRendering(false)
                }
            },
            `${instanceId.current}-preview`
        )

        return () => {
            eventBus.off("toolpath:preview", listenerId)
        }
        // cameraRef/canvasRef/modelRef/rendererRef are stable refs, renderCurrent is a stable
        // (empty-deps) callback, and the setters are useState setters (all stable); the original
        // effect only re-subscribed on [viewIndex, visiblePresets], preserved here as-is.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewIndex, visiblePresets])

    useEffect(() => {
        const resetId = eventBus.on(
            "toolpath:reset",
            () => {
                // ⛔ cancelar animaciones
                if (rafRef.current) {
                    cancelAnimationFrame(rafRef.current)
                    rafRef.current = null
                }

                // 🧹 LIBERAR MODELO (CLAVE)
                if (modelRef.current) {
                    modelRef.current.segments.length = 0
                    modelRef.current.bbox = undefined as any
                }
                modelRef.current = null

                // 🔴 tool off
                setToolPos(null)

                // 🎥 reset cámara
                cameraRef.current = resetCameraState()

                // 🎨 render SIN modelo (canvas vacío)
                renderCurrent(visiblePresets[viewIndex], cameraRef.current, undefined, showGrid)
                setSelectedFile(null)
            },
            `${instanceId.current}-reset`
        )

        return () => {
            eventBus.off("toolpath:reset", resetId)
        }
        // Same reasoning as the toolpath:preview effect above: refs/renderCurrent/setters are
        // stable; the original effect only re-subscribed on [viewIndex, showGrid, visiblePresets].
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewIndex, showGrid, visiblePresets])
}
