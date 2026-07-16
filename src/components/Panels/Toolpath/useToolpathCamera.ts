/*
 useToolpathCamera.ts - wires cameraMath.ts's pure zoom/pan/pinch math to
 wheel, mouse-drag and touch (pan + pinch-zoom + double-tap-to-reset) events
 on the toolpath viewer's canvas.

 The camera itself is kept in a mutable ref (not Preact state): every
 wheel/pointer-move tick calls onCameraChange() to trigger an imperative
 canvas redraw instead of a re-render, matching the original inline
 implementation's performance intent.
*/
import { useRef, useEffect, useCallback } from "preact/hooks"
import {
    type CameraState,
    zoomBy,
    panBy,
    resetCamera as resetCameraState,
    wheelZoomFactor,
    distance,
    midpoint,
    pinchZoomFactor,
} from "./cameraMath"

interface UseToolpathCameraParams {
    canvasRef: { current: HTMLCanvasElement | null }
    // Called with the just-updated camera so the caller can redraw the canvas.
    // Takes the camera as an argument (rather than the caller reading cameraRef
    // itself) to avoid a circular dependency: cameraRef is only returned by
    // this hook, which itself needs onCameraChange as an input. Re-subscribes
    // the event listeners whenever this callback's identity changes, so
    // callers should memoize it (see ToolpathPanel.tsx).
    onCameraChange: (camera: CameraState) => void
}

export interface UseToolpathCameraResult {
    cameraRef: { current: CameraState }
    resetCamera: () => void
    draggingRef: { current: boolean }
    hasMovedRef: { current: boolean }
}

export function useToolpathCamera({ canvasRef, onCameraChange }: UseToolpathCameraParams): UseToolpathCameraResult {
    const cameraRef = useRef<CameraState>({ zoom: 1, panX: 0, panY: 0 })

    // 🖐️ Pan (drag)
    const draggingRef = useRef(false)
    const lastMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
    const hasMovedRef = useRef(false)
    const lastTouchCenterRef = useRef<{ x: number; y: number } | null>(null)
    const pinchActiveRef = useRef(false)
    const skipNextPanRef = useRef(false)

    // 👆 Doble tap (touch)
    const lastTapRef = useRef(0)

    const resetCamera = useCallback(() => {
        cameraRef.current = resetCameraState()
        onCameraChange(cameraRef.current)
    }, [onCameraChange])

    // 🖱️ Zoom con rueda
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const onWheel = (e: WheelEvent) => {
            e.preventDefault()
            cameraRef.current = zoomBy(cameraRef.current, wheelZoomFactor(e.deltaY))
            onCameraChange(cameraRef.current)
        }

        canvas.addEventListener("wheel", onWheel, { passive: false })

        return () => {
            canvas.removeEventListener("wheel", onWheel)
        }
        // canvasRef is a stable ref (its .current is read once per effect run, not
        // tracked reactively); omitted so this only re-subscribes when onCameraChange changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onCameraChange])

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
            cameraRef.current = panBy(cameraRef.current, dx, dy)
            onCameraChange(cameraRef.current)
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
        // canvasRef is a stable ref; omitted so this only re-subscribes when onCameraChange changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onCameraChange])

    // 📱 Touch pan + pinch zoom
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        let lastTouchDist = 0

        const touchPoint = (t: Touch) => ({ x: t.clientX, y: t.clientY })

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
                lastTouchDist = distance(touchPoint(e.touches[0]), touchPoint(e.touches[1]))
                lastTouchCenterRef.current = midpoint(
                    touchPoint(e.touches[0]),
                    touchPoint(e.touches[1])
                )
            }
        }

        const onTouchMove = (e: TouchEvent) => {
            e.preventDefault()

            // ✌️ Pinch zoom (2 dedos)
            if (e.touches.length === 2) {
                pinchActiveRef.current = true

                const dist = distance(touchPoint(e.touches[0]), touchPoint(e.touches[1]))
                cameraRef.current = zoomBy(cameraRef.current, pinchZoomFactor(dist, lastTouchDist))
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

                cameraRef.current = panBy(cameraRef.current, dx, dy)
            }

            onCameraChange(cameraRef.current)
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
        // canvasRef is a stable ref; omitted so this only re-subscribes when onCameraChange/resetCamera change.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onCameraChange, resetCamera])

    return { cameraRef, resetCamera, draggingRef, hasMovedRef }
}
