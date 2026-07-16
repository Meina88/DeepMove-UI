import { describe, it, expect } from "vitest"
import {
    clampZoom,
    zoomBy,
    panBy,
    resetCamera,
    wheelZoomFactor,
    distance,
    midpoint,
    pinchZoomFactor,
    MIN_ZOOM,
    MAX_ZOOM,
} from "./cameraMath"

describe("clampZoom", () => {
    it("passes through values within range", () => {
        expect(clampZoom(1)).toBe(1)
        expect(clampZoom(5)).toBe(5)
    })

    it("clamps to MIN_ZOOM/MAX_ZOOM at the edges", () => {
        expect(clampZoom(0.01)).toBe(MIN_ZOOM)
        expect(clampZoom(50)).toBe(MAX_ZOOM)
    })
})

describe("zoomBy", () => {
    it("multiplies zoom by the factor and clamps the result", () => {
        const camera = { zoom: 1, panX: 10, panY: 20 }
        expect(zoomBy(camera, 1.1).zoom).toBeCloseTo(1.1)
        expect(zoomBy(camera, 100).zoom).toBe(MAX_ZOOM)
    })

    it("does not mutate the input and preserves pan", () => {
        const camera = { zoom: 1, panX: 10, panY: 20 }
        const next = zoomBy(camera, 2)
        expect(camera.zoom).toBe(1)
        expect(next.panX).toBe(10)
        expect(next.panY).toBe(20)
    })
})

describe("panBy", () => {
    it("adds the delta to panX/panY without touching zoom", () => {
        const camera = { zoom: 2, panX: 10, panY: 20 }
        const next = panBy(camera, 5, -3)
        expect(next).toEqual({ zoom: 2, panX: 15, panY: 17 })
    })
})

describe("resetCamera", () => {
    it("returns the identity camera", () => {
        expect(resetCamera()).toEqual({ zoom: 1, panX: 0, panY: 0 })
    })
})

describe("wheelZoomFactor", () => {
    it("zooms in on negative deltaY (scroll up)", () => {
        expect(wheelZoomFactor(-100)).toBe(1.1)
    })

    it("zooms out on positive deltaY (scroll down)", () => {
        expect(wheelZoomFactor(100)).toBe(0.9)
    })
})

describe("distance/midpoint", () => {
    it("computes euclidean distance between two points", () => {
        expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
    })

    it("computes the midpoint between two points", () => {
        expect(midpoint({ x: 0, y: 0 }, { x: 10, y: 20 })).toEqual({ x: 5, y: 10 })
    })
})

describe("pinchZoomFactor", () => {
    it("returns 1 (no-op) when there is no previous distance", () => {
        expect(pinchZoomFactor(50, 0)).toBe(1)
    })

    it("returns the ratio of current to last distance otherwise", () => {
        expect(pinchZoomFactor(100, 50)).toBe(2)
        expect(pinchZoomFactor(25, 50)).toBe(0.5)
    })
})
