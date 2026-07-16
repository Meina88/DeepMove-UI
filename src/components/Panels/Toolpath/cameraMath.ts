/*
 cameraMath.ts - pure zoom/pan/pinch math for the toolpath viewer's camera.
 Kept free of DOM/event wiring so it's testable without a canvas or pointer
 events; see useToolpathCamera.ts for the event wiring that uses these.
*/

export interface CameraState {
    zoom: number
    panX: number
    panY: number
}

export interface Point {
    x: number
    y: number
}

export const MIN_ZOOM = 0.1
export const MAX_ZOOM = 10

export function clampZoom(zoom: number): number {
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom))
}

export function zoomBy(camera: CameraState, factor: number): CameraState {
    return { ...camera, zoom: clampZoom(camera.zoom * factor) }
}

export function panBy(camera: CameraState, dx: number, dy: number): CameraState {
    return { ...camera, panX: camera.panX + dx, panY: camera.panY + dy }
}

export function resetCamera(): CameraState {
    return { zoom: 1, panX: 0, panY: 0 }
}

// Mouse wheel: deltaY < 0 is scroll-up/zoom-in
export function wheelZoomFactor(deltaY: number): number {
    return deltaY < 0 ? 1.1 : 0.9
}

export function distance(p1: Point, p2: Point): number {
    const dx = p1.x - p2.x
    const dy = p1.y - p2.y
    return Math.hypot(dx, dy)
}

export function midpoint(p1: Point, p2: Point): Point {
    return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }
}

// Two-finger pinch: ratio of the current inter-finger distance to the last
// measured one; 1 (no-op) until a previous distance has been recorded.
export function pinchZoomFactor(currentDist: number, lastDist: number): number {
    return lastDist > 0 ? currentDist / lastDist : 1
}
