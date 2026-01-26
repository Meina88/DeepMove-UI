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
import { useTargetContext } from "../../targets"

import { CanvasRenderer } from "../Toolpath"
import { VIEW_PRESETS } from "../Toolpath/render/ViewPresets"

import { ToolpathModel } from "../Toolpath/core/ToolpathModel"
import { ModalInterpreter } from "../Toolpath/core/ModalInterpreter"

import { httpAdapter } from "../../adapters/httpAdapter"
import { eventBus } from "../../hooks/eventBus"





const ToolpathPanel: FunctionalComponent = () => {
    const id = "toolpathPanel"
    const showPanel = useUiContextFn.getValue("showtoolpathpanel")
    const { positions } = useTargetContext()

    // NO retornar acá (así se montan los hooks y el listener)


    const canvasRef = useRef<HTMLCanvasElement>(null)
    const rendererRef = useRef<CanvasRenderer | null>(null)
    const modelRef = useRef<ToolpathModel | null>(null)

    const [viewIndex, setViewIndex] = useState(0)

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
    const segIndexRef = useRef(0)
    const tRef = useRef(0)

    // 🟦 Progreso de segmentos completados
    const completedSegRef = useRef<number>(-1)


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


    useEffect(() => {
        const listenerId = eventBus.on(
            "toolpath:preview",
            async (data: { url: string; filename: string }) => {

                console.log("📩 toolpath:preview", data)

                try {
                    eventBus.emit("openpanel", "toolpathPanel")

                    if (rafRef.current) {
                        cancelAnimationFrame(rafRef.current)
                        rafRef.current = null
                    }

                    segIndexRef.current = 0
                    tRef.current = 0
                    completedSegRef.current = -1                    

                    // 🔽 DESCARGA DIRECTA (URL YA RESUELTA)
                    const res = await httpAdapter(data.url, {
                        method: "GET",
                        id: "download-toolpath-preview",
                    })

                    const result = await res.response
                    const gcodeText =
                        typeof result === "string"
                            ? result
                            : await result.text()

                    // 🔽 PARSE
                    const model = new ToolpathModel()
                    new ModalInterpreter(model).parse(gcodeText)
                    modelRef.current = model

                    const first = model.segments[0]
                    setToolPos(first ? { ...first.start } : null)

                    cameraRef.current.zoom = 1
                    cameraRef.current.panX = 0
                    cameraRef.current.panY = 0

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
                        VIEW_PRESETS[viewIndex],
                        cameraRef.current,
                        first ? { ...first.start } : undefined,
                        0
                    )

                } catch (err) {
                    console.error("Toolpath preview error:", err)
                }
            },
            "toolpath-preview"
        )

        return () => {
            eventBus.off("toolpath:preview", listenerId)
        }
    }, [viewIndex])






    // ⏹ Stop / Reset
    const stopAndReset = () => {       

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
  <div
    class="panel panel-dashboard"
    id={id}
    style={!showPanel ? { display: "none" } : undefined}
  >

            <ContainerHelper id={id} />

            <div class="navbar">
                <span class="navbar-section">
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
