/*
 Toolpath.tsx - ESP3D WebUI custom panel
*/

import { FunctionalComponent } from "preact"
import { useEffect, useRef, useState } from "preact/hooks"

import { T } from "../Translations"
import { ContainerHelper, FullScreenButton, CloseButton } from "../Controls"
import { Menu as PanelMenu } from "./"
import { Eye, CheckCircle, Circle, Trash2 } from "preact-feather"
import { useUiContextFn } from "../../contexts"
import { useTargetContext } from "../../targets"

import { CanvasRenderer } from "../Toolpath"
import { VIEW_PRESETS } from "../Toolpath/render/ViewPresets"

import { ToolpathModel } from "../Toolpath/core/ToolpathModel"
import { ModalInterpreter } from "../Toolpath/core/ModalInterpreter"

import { httpAdapter } from "../../adapters/httpAdapter"
import { eventBus } from "../../hooks/eventBus"
import { ClearPath } from "../../targets/CNC/FluidNC/icons"


const ToolpathPanel: FunctionalComponent = () => {
    const id = "toolpathPanel"
    const showPanel = useUiContextFn.getValue("showtoolpathpanel")
    const { positions } = useTargetContext()

    // NO retornar acá (así se montan los hooks y el listener)


    const canvasRef = useRef<HTMLCanvasElement>(null)
    const rendererRef = useRef<CanvasRenderer | null>(null)
    const modelRef = useRef<ToolpathModel | null>(null)

    const [viewIndex, setViewIndex] = useState(0)
    const [isRendering, setIsRendering] = useState(false)
    const [showGrid, setShowGrid] = useState<boolean>(() => {
        const v = localStorage.getItem("toolpath.showGrid")
        return v === null ? true : v === "true"
    })

    useEffect(() => {
        localStorage.setItem("toolpath.showGrid", String(showGrid))
    }, [showGrid])

    type ViewId = "top" | "oblique" | "front" | "side"

    const DEFAULT_VIEWS: ViewId[] = ["top", "oblique"]

    const [enabledViews, setEnabledViews] = useState<ViewId[]>(() => {
        const raw = localStorage.getItem("toolpath.enabledViews")
        if (!raw) return DEFAULT_VIEWS

        try {
            return JSON.parse(raw)
        } catch {
            return DEFAULT_VIEWS
        }
    })

    useEffect(() => {
        localStorage.setItem(
            "toolpath.enabledViews",
            JSON.stringify(enabledViews)
        )
    }, [enabledViews])

    const visiblePresets = VIEW_PRESETS.filter(v =>
        enabledViews.includes(v.id as ViewId)
    )

    useEffect(() => {
        if (viewIndex >= visiblePresets.length) {
            setViewIndex(0)
        }
    }, [enabledViews])



    // 🔵 Toolhead
    const [toolPos, setToolPos] = useState<{ x: number; y: number; z: number } | null>(null)




    // 🎥 Cámara (ZOOM / PAN)
    const cameraRef = useRef({
        zoom: 1,
        panX: 0,
        panY: 0,
    })

    // 🖐️ Pan (drag)
    const draggingRef = useRef(false)
    const lastMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
    const hasMovedRef = useRef(false)
    const lastTouchCenterRef = useRef<{ x: number; y: number } | null>(null)
    const pinchActiveRef = useRef(false)
    const skipNextPanRef = useRef(false)

    // 🖱️ Click simple diferido (para distinguir double click)
    const clickTimeoutRef = useRef<number | null>(null)

    // 👆 Doble tap (touch)
    const lastTapRef = useRef(0)

    // RAF
    const rafRef = useRef<number | null>(null)

    // Estado interno de animación









    // 🔴 TOOL REAL — sigue WPos (igual que Jog: positions.wx/wy/wz suelen ser strings)
    useEffect(() => {
        if (!positions) return

        // 1) Preferimos WPos si existe
        const rawX = (positions as any).wx ?? (positions as any).x
        const rawY = (positions as any).wy ?? (positions as any).y
        const rawZ = (positions as any).wz ?? (positions as any).z

        const x = typeof rawX === "number" ? rawX : parseFloat(String(rawX))
        const y = typeof rawY === "number" ? rawY : parseFloat(String(rawY))
        const z = typeof rawZ === "number" ? rawZ : parseFloat(String(rawZ))

        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return

        setToolPos({ x, y, z })
    }, [positions])






    // 🔁 Redraw
    useEffect(() => {
        const renderer = rendererRef.current
        if (!renderer) return

        renderer.render(
            modelRef.current ?? null,
            visiblePresets[viewIndex],
            cameraRef.current,          // camera
            toolPos ?? undefined,
            showGrid
        )
    }, [viewIndex, toolPos, showGrid])


    // 📐 Resize
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        if (!rendererRef.current) {
            rendererRef.current = new CanvasRenderer(canvas)
        }

        const resize = () => {
            const rect = canvas.getBoundingClientRect()
            const dpr = window.devicePixelRatio || 1

            canvas.width = Math.max(1, Math.floor(rect.width * dpr))
            canvas.height = Math.max(1, Math.floor(rect.height * dpr))

            const ctx = canvas.getContext("2d")
            if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

            const renderer = rendererRef.current
            if (!renderer) return

            renderer.render(
                modelRef.current ?? null,
                visiblePresets[viewIndex],
                cameraRef.current,
                toolPos ?? undefined,
                showGrid
            )
        }

        resize()

        const ro = new ResizeObserver(resize)
        ro.observe(canvas)

        window.addEventListener("resize", resize)

        return () => {
            ro.disconnect()
            window.removeEventListener("resize", resize)
        }
    }, [viewIndex, toolPos, showGrid])

    // 🖱️ Zoom con rueda
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const onWheel = (e: WheelEvent) => {
            e.preventDefault()

            const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9
            cameraRef.current.zoom = Math.min(
                10,
                Math.max(0.1, cameraRef.current.zoom * zoomFactor)
            )

            const renderer = rendererRef.current
            if (!renderer) return

            renderer.render(
                modelRef.current ?? null,
                visiblePresets[viewIndex],
                cameraRef.current,
                toolPos ?? undefined,
                showGrid
            )
        }

        canvas.addEventListener("wheel", onWheel, { passive: false })

        return () => {
            canvas.removeEventListener("wheel", onWheel)
        }
    }, [viewIndex, toolPos, showGrid])



    // 🖐️ Pan con drag (mouse)
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const onMouseDown = (e: MouseEvent) => {
            draggingRef.current = true
            hasMovedRef.current = false
            lastMouseRef.current = { x: e.clientX, y: e.clientY }
            canvas.style.cursor = "grabbing"
        }

        const onMouseMove = (e: MouseEvent) => {
            if (!draggingRef.current) return

            const dx = e.clientX - lastMouseRef.current.x
            const dy = e.clientY - lastMouseRef.current.y

            if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
                hasMovedRef.current = true
            }

            lastMouseRef.current = { x: e.clientX, y: e.clientY }

            cameraRef.current.panX += dx
            cameraRef.current.panY += dy

            const renderer = rendererRef.current
            if (!renderer) return

            renderer.render(
                modelRef.current ?? null,
                visiblePresets[viewIndex],
                cameraRef.current,
                toolPos ?? undefined,
                showGrid
            )
        }

        const stopDrag = () => {
            draggingRef.current = false
            canvas.style.cursor = "default"
        }

        canvas.addEventListener("mousedown", onMouseDown)
        window.addEventListener("mousemove", onMouseMove)
        window.addEventListener("mouseup", stopDrag)
        canvas.addEventListener("mouseleave", stopDrag)

        return () => {
            canvas.removeEventListener("mousedown", onMouseDown)
            window.removeEventListener("mousemove", onMouseMove)
            window.removeEventListener("mouseup", stopDrag)
            canvas.removeEventListener("mouseleave", stopDrag)
        }
    }, [viewIndex, toolPos, showGrid])


    const getTouchCenter = (t1: Touch, t2: Touch) => ({
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
    })


    // 📱 Touch pan + pinch zoom
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        let lastTouchDist = 0

        const getDist = (t1: Touch, t2: Touch) => {
            const dx = t1.clientX - t2.clientX
            const dy = t1.clientY - t2.clientY
            return Math.hypot(dx, dy)
        }

        const onTouchStart = (e: TouchEvent) => {
            // 👆 Doble tap (touch) para centrar
            const now = Date.now()
            if (e.touches.length === 1) {
                if (now - lastTapRef.current < 300) {
                    resetCamera()
                    lastTapRef.current = 0
                    return
                }
                lastTapRef.current = now
            }

            if (e.touches.length === 1) {
                const t = e.touches[0]
                lastMouseRef.current = { x: t.clientX, y: t.clientY }
            }

            if (e.touches.length === 2) {
                lastTouchDist = getDist(e.touches[0], e.touches[1])
                lastTouchCenterRef.current = getTouchCenter(
                    e.touches[0],
                    e.touches[1]
                )
            }

        }

        const onTouchMove = (e: TouchEvent) => {
            e.preventDefault()

            const renderer = rendererRef.current
            if (!renderer) return

            // ✌️ Pinch zoom (2 dedos)
            if (e.touches.length === 2) {
                pinchActiveRef.current = true

                const dist = getDist(e.touches[0], e.touches[1])
                if (lastTouchDist > 0) {
                    const zoomFactor = dist / lastTouchDist
                    cameraRef.current.zoom = Math.min(
                        10,
                        Math.max(0.1, cameraRef.current.zoom * zoomFactor)
                    )
                }
                lastTouchDist = dist
            }

            // ☝️ Pan (1 dedo) — SOLO si no venimos de pinch
            else if (e.touches.length === 1 && !pinchActiveRef.current) {

                // 👈 consumir el skip UNA vez
                if (skipNextPanRef.current) {
                    skipNextPanRef.current = false
                    return
                }

                const t = e.touches[0]
                const dx = t.clientX - lastMouseRef.current.x
                const dy = t.clientY - lastMouseRef.current.y

                lastMouseRef.current = { x: t.clientX, y: t.clientY }

                cameraRef.current.panX += dx
                cameraRef.current.panY += dy
            }

            renderer.render(
                modelRef.current ?? null,
                visiblePresets[viewIndex],
                cameraRef.current,
                toolPos ?? undefined,
                showGrid
            )
        }



        const onTouchEnd = (e: TouchEvent) => {
            lastTouchDist = 0
            lastTouchCenterRef.current = null

            if (e.touches.length < 2) {
                pinchActiveRef.current = false

                // 👇 IMPORTANTE: evitar pan residual
                skipNextPanRef.current = true

                if (e.touches.length === 1) {
                    const t = e.touches[0]
                    lastMouseRef.current = { x: t.clientX, y: t.clientY }
                }
            }
        }




        canvas.addEventListener("touchstart", onTouchStart, { passive: false })
        canvas.addEventListener("touchmove", onTouchMove, { passive: false })
        canvas.addEventListener("touchend", onTouchEnd)

        return () => {
            canvas.removeEventListener("touchstart", onTouchStart)
            canvas.removeEventListener("touchmove", onTouchMove)
            canvas.removeEventListener("touchend", onTouchEnd)
        }
    }, [viewIndex, toolPos])

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

                    rendererRef.current.render(
                        model,
                        visiblePresets[viewIndex],
                        cameraRef.current,
                        first ? { ...first.start } : undefined,

                    )

                    setIsRendering(false)

                } catch (err) {
                    console.error("Toolpath preview error:", err)
                    setIsRendering(false)
                }
            },
            "toolpath-preview"
        )

        return () => {
            eventBus.off("toolpath:preview", listenerId)
        }
    }, [viewIndex])


    useEffect(() => {
        const resetId = eventBus.on(
            "toolpath:reset",
            () => {
                // cancelar animación
                if (rafRef.current) {
                    cancelAnimationFrame(rafRef.current)
                    rafRef.current = null
                }

                // reset refs

                modelRef.current = null
                setToolPos(null)

                // reset cámara
                cameraRef.current.zoom = 1
                cameraRef.current.panX = 0
                cameraRef.current.panY = 0

                // renderizar modelo vacío (CLAVE)
                const canvas = canvasRef.current
                if (canvas && rendererRef.current) {
                    const emptyModel = new ToolpathModel()

                    rendererRef.current.render(
                        emptyModel,
                        visiblePresets[viewIndex],
                        cameraRef.current,
                        undefined,

                    )
                }
            },
            "toolpath-reset"
        )

        return () => {
            eventBus.off("toolpath:reset", resetId)
        }
    }, [viewIndex])





    // 🎯 Reset cámara: centrar vista (zoom/pan default)
    const resetCamera = () => {
        cameraRef.current.zoom = 1
        cameraRef.current.panX = 0
        cameraRef.current.panY = 0

        const renderer = rendererRef.current
        if (!renderer) return

        renderer.render(
            modelRef.current ?? null,
            visiblePresets[viewIndex],
            cameraRef.current,
            toolPos ?? undefined,
            showGrid
        )
    }


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
        Toolpath
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
  title="Clear toolpath"
  onClick={() => eventBus.emit("toolpath:reset", null)}
  style={{
    marginRight: "0.2rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
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
                        label: "Grid",
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
                                ? "Top"
                                : id === "oblique"
                                    ? "Isometric"
                                    : id === "front"
                                        ? "Front"
                                        : "Side",

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
    name: "Toolpath",
    icon: "Eye",
    show: "showtoolpathpanel",
    onstart: "opentoolpathonstart",
    settingid: "toolpath",
}

export { ToolpathPanel, ToolpathPanelElement }
