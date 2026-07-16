/*
 useCanvasRenderer.ts - owns the canvas/CanvasRenderer/ToolpathModel refs for
 the toolpath viewer and collapses the renderer.render(...) call (previously
 repeated at every call site: redraw, resize, wheel, mouse-pan, touch, and the
 toolpath:reset event) into a single renderCurrent() helper.
*/
import { useRef, useCallback } from "preact/hooks"
import { CanvasRenderer } from "../../Toolpath"
import { ToolpathModel } from "../../Toolpath/core/ToolpathModel"
import type { ViewPreset } from "../../Toolpath/types/toolpath.types"
import type { CameraState } from "./cameraMath"

interface ToolPosition {
    x: number
    y: number
    z: number
}

export interface UseCanvasRendererResult {
    canvasRef: { current: HTMLCanvasElement | null }
    rendererRef: { current: CanvasRenderer | null }
    modelRef: { current: ToolpathModel | null }
    // Lazily constructs the CanvasRenderer for the current canvas if needed, returns it (or null
    // if the canvas isn't mounted yet).
    ensureRenderer: () => CanvasRenderer | null
    // showGrid intentionally optional/undefined-able: CanvasRenderer.render defaults it to `true`
    // when omitted, which the initial toolpath:preview render relies on (see useToolpathFileEvents).
    renderCurrent: (view: ViewPreset, camera: CameraState, toolPos: ToolPosition | null | undefined, showGrid?: boolean) => void
}

export function useCanvasRenderer(): UseCanvasRendererResult {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const rendererRef = useRef<CanvasRenderer | null>(null)
    const modelRef = useRef<ToolpathModel | null>(null)

    // Stable (empty-deps) on purpose: both only ever read refs' `.current` at
    // call time, so callers (e.g. the camera hook's onCameraChange) can depend
    // on these without resubscribing their own effects on every render.
    const ensureRenderer = useCallback((): CanvasRenderer | null => {
        const canvas = canvasRef.current
        if (!canvas) return null
        if (!rendererRef.current) {
            rendererRef.current = new CanvasRenderer(canvas)
        }
        return rendererRef.current
    }, [])

    const renderCurrent = useCallback((
        view: ViewPreset,
        camera: CameraState,
        toolPos: ToolPosition | null | undefined,
        showGrid?: boolean
    ) => {
        const renderer = rendererRef.current
        if (!renderer) return
        renderer.render(modelRef.current ?? null, view, camera, toolPos ?? undefined, showGrid)
    }, [])

    return { canvasRef, rendererRef, modelRef, ensureRenderer, renderCurrent }
}
