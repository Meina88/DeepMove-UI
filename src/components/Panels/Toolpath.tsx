/*
 Toolpath.tsx - ESP3D WebUI custom panel
*/

import { FunctionalComponent } from "preact"
import { useEffect, useRef, useState } from "preact/hooks"

import { T } from "../Translations"
import { ContainerHelper, FullScreenButton, CloseButton } from "../Controls"
import { Menu as PanelMenu } from "./"
import { Eye } from "preact-feather"
import { useUiContextFn } from "../../contexts"

import { CanvasRenderer } from "../Toolpath"
import { VIEW_PRESETS } from "../Toolpath/render/ViewPresets"

import { ToolpathModel } from "../Toolpath/core/ToolpathModel"
import { ModalInterpreter } from "../Toolpath/core/ModalInterpreter"

// GCode de prueba
const TEST_GCODE = `

( Cuadrado 50x50 mm con 1 esquina redondeada (R=10) en la esquina superior derecha )
( Plano XY, mm, absoluto. Sin Z de corte: solo trayectoria 2D )
G21
G90
G17

G0 Z5.000
G0 X0.000 Y0.000
G0 Z0.000

( Recorre CCW: (0,0) -> (50,0) -> (50,40) -> arco a (40,50) -> (0,50) -> (0,0) )
G1 X50.000 Y0.000 F1500
G1 X50.000 Y40.000
G2 X40.000 Y50.000 I-10.000 J0.000
G1 X0.000 Y50.000
G1 X0.000 Y0.000

G0 Z5.000
M2


`

const ToolpathPanel: FunctionalComponent = () => {
    const id = "toolpathPanel"
    if (!useUiContextFn.getValue("showtoolpathpanel")) return null

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const rendererRef = useRef<CanvasRenderer | null>(null)
    const modelRef = useRef<ToolpathModel | null>(null)

    const [viewIndex, setViewIndex] = useState(0)

    // 🔵 Toolhead
    const [toolPos, setToolPos] = useState<{ x: number; y: number; z: number } | null>(null)

    // ▶️ Play / Pause
    const [playing, setPlaying] = useState(true)
    const playingRef = useRef(true)

    // ⏩ Velocidad visual
    const speedRef = useRef(1)

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
    const segIndexRef = useRef(0)
    const tRef = useRef(0)

    // 🟦 Progreso de segmentos completados
    const completedSegRef = useRef<number>(-1)

    // sync state → ref
    useEffect(() => {
        playingRef.current = playing
    }, [playing])

    // 🔹 Init
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const model = new ToolpathModel()
        new ModalInterpreter(model).parse(TEST_GCODE)

        modelRef.current = model
        rendererRef.current = new CanvasRenderer(canvas)

        canvas.width = canvas.clientWidth
        canvas.height = canvas.clientHeight

        const first = model.segments[0]
        if (first) setToolPos({ ...first.start })

        animateToolhead(model)
    }, [])

    // 🔁 Redraw
    useEffect(() => {
        const renderer = rendererRef.current
        const model = modelRef.current
        if (!renderer || !model) return

        renderer.render(
            model,
            VIEW_PRESETS[viewIndex],
            cameraRef.current,              // ✅ camera
            toolPos ?? undefined,
            completedSegRef.current + 1
        )
    }, [viewIndex, toolPos])

    // 📐 Resize
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const resize = () => {
            const rect = canvas.getBoundingClientRect()
            const dpr = window.devicePixelRatio || 1

            canvas.width = Math.max(1, Math.floor(rect.width * dpr))
            canvas.height = Math.max(1, Math.floor(rect.height * dpr))

            const ctx = canvas.getContext("2d")
            if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

            const renderer = rendererRef.current
            const model = modelRef.current
            if (renderer && model) {
                renderer.render(
                    model,
                    VIEW_PRESETS[viewIndex],
                    cameraRef.current,           // ✅ camera
                    toolPos ?? undefined,
                    completedSegRef.current + 1
                )
            }
        }

        resize()

        const ro = new ResizeObserver(resize)
        ro.observe(canvas)

        window.addEventListener("resize", resize)

        return () => {
            ro.disconnect()
            window.removeEventListener("resize", resize)
        }
    }, [viewIndex, toolPos])

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
            const model = modelRef.current
            if (renderer && model) {
                renderer.render(
                    model,
                    VIEW_PRESETS[viewIndex],
                    cameraRef.current,
                    toolPos ?? undefined,
                    completedSegRef.current + 1
                )
            }
        }

        canvas.addEventListener("wheel", onWheel, { passive: false })

        return () => {
            canvas.removeEventListener("wheel", onWheel)
        }
    }, [viewIndex, toolPos])


    // 🖐️ Pan con drag (mouse)
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const onMouseDown = (e: MouseEvent) => {
            draggingRef.current = true
            hasMovedRef.current = false   // 👈 IMPORTANTE
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
            const model = modelRef.current
            if (renderer && model) {
                renderer.render(
                    model,
                    VIEW_PRESETS[viewIndex],
                    cameraRef.current,
                    toolPos ?? undefined,
                    completedSegRef.current + 1
                )
            }
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
    }, [viewIndex, toolPos])

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
            const model = modelRef.current
            if (!renderer || !model) return

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
                model,
                VIEW_PRESETS[viewIndex],
                cameraRef.current,
                toolPos ?? undefined,
                completedSegRef.current + 1
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


    // ▶️ Animación
    const animateToolhead = (model: ToolpathModel) => {
        const baseSpeed = 0.99

        const step = () => {
            if (!playingRef.current) {
                rafRef.current = requestAnimationFrame(step)
                return
            }

            const seg = model.segments[segIndexRef.current]
            if (!seg) return

            tRef.current += baseSpeed * speedRef.current

            if (tRef.current >= 1) {
                completedSegRef.current = segIndexRef.current
                tRef.current = 0
                segIndexRef.current++

                if (segIndexRef.current >= model.segments.length) {
                    rafRef.current = null
                    setPlaying(false)
                    return
                }

                rafRef.current = requestAnimationFrame(step)
                return
            }

            setToolPos({
                x: seg.start.x + (seg.end.x - seg.start.x) * tRef.current,
                y: seg.start.y + (seg.end.y - seg.start.y) * tRef.current,
                z: seg.start.z + (seg.end.z - seg.start.z) * tRef.current,
            })

            rafRef.current = requestAnimationFrame(step)
        }

        rafRef.current = requestAnimationFrame(step)
    }

    const startAnimation = () => {
        const model = modelRef.current
        if (!model) return
        if (rafRef.current !== null) return
        animateToolhead(model)
    }

    // ⏹ Stop / Reset
    const stopAndReset = () => {
        setPlaying(false)

        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current)
            rafRef.current = null
        }

        segIndexRef.current = 0
        tRef.current = 0
        completedSegRef.current = -1

        const first = modelRef.current?.segments[0]
        if (first) setToolPos({ ...first.start })
    }

    // 🎯 Reset cámara: centrar modelo (zoom/pan default)
    const resetCamera = () => {
        cameraRef.current.zoom = 1
        cameraRef.current.panX = 0
        cameraRef.current.panY = 0

        const renderer = rendererRef.current
        const model = modelRef.current
        if (renderer && model) {
            renderer.render(
                model,
                VIEW_PRESETS[viewIndex],
                cameraRef.current,
                toolPos ?? undefined,
                completedSegRef.current + 1
            )
        }
    }


    return (
        <div class="panel panel-dashboard" id={id}>
            <ContainerHelper id={id} />

            <div class="navbar">
                <span class="navbar-section feather-icon-container">
                    <Eye />
                    <strong class="text-ellipsis">{T("Toolpath")}</strong>
                </span>

                <span class="navbar-section">
                    <button class="btn btn-link" onClick={stopAndReset}>⏹</button>

                    <button
                        class="btn btn-link"
                        onClick={() => {
                            setPlaying(p => {
                                const next = !p
                                if (next) startAnimation()
                                return next
                            })
                        }}
                    >
                        {playing ? "⏸" : "▶"}
                    </button>

                    <button class="btn btn-link" onClick={() => speedRef.current = Math.max(0.25, speedRef.current / 1.25)}>−</button>
                    <span style={{ minWidth: 36, textAlign: "center", fontSize: "0.8em" }}>
                        {speedRef.current.toFixed(2)}x
                    </span>
                    <button class="btn btn-link" onClick={() => speedRef.current = Math.min(4, speedRef.current * 1.25)}>+</button>

                    <PanelMenu items={[]} />
                    <FullScreenButton elementId={id} />
                    <CloseButton elementId={id} hideOnFullScreen />
                </span>
            </div>

            <div class="panel-body panel-body-dashboard m-2">
                <canvas
                    ref={canvasRef}
                    style={{ width: "100%", height: "100%", background: "#111", borderRadius: "6px", touchAction: "none" }}
                    onClick={() => {
                        if (hasMovedRef.current) return

                        // esperamos por si viene un segundo click
                        if (clickTimeoutRef.current) {
                            clearTimeout(clickTimeoutRef.current)
                            clickTimeoutRef.current = null
                        }

                        clickTimeoutRef.current = window.setTimeout(() => {
                            setViewIndex(v => (v + 1) % VIEW_PRESETS.length)
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
            </div>
        </div>
    )
}

const ToolpathPanelElement = {
    id: "toolpathPanel",
    content: <ToolpathPanel />,
    name: "Toolpath",
    icon: "GitCommit",
    show: "showtoolpathpanel",
    onstart: "opentoolpathonstart",
    settingid: "toolpath",
}

export { ToolpathPanel, ToolpathPanelElement }
