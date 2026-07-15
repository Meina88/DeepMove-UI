import { describe, expect, it, vi } from "vitest"
import { ModalInterpreter } from "./ModalInterpreter"
import { ToolpathModel } from "./ToolpathModel"

// Characterization tests: pin the current G-code interpreter behavior before
// Toolpath.tsx (Paso 11) is decomposed. These describe what the parser does
// today, not an independent geometric spec.

describe("ModalInterpreter - straight lines", () => {
    it("parses an absolute G1 move into a single feed segment", () => {
        const model = new ToolpathModel()
        new ModalInterpreter(model).parse("G1 X10 Y10")

        expect(model.segments).toEqual([
            { start: { x: 0, y: 0, z: 0 }, end: { x: 10, y: 10, z: 0 }, type: "feed" },
        ])
    })

    it("parses a G0 move as a rapid segment", () => {
        const model = new ToolpathModel()
        new ModalInterpreter(model).parse("G0 X5")

        expect(model.segments).toEqual([
            { start: { x: 0, y: 0, z: 0 }, end: { x: 5, y: 0, z: 0 }, type: "rapid" },
        ])
    })

    it("accumulates incremental (G91) moves onto the current position", () => {
        const model = new ToolpathModel()
        new ModalInterpreter(model).parse("G1 X10\nG91\nG1 X5")

        expect(model.segments).toEqual([
            { start: { x: 0, y: 0, z: 0 }, end: { x: 10, y: 0, z: 0 }, type: "feed" },
            { start: { x: 10, y: 0, z: 0 }, end: { x: 15, y: 0, z: 0 }, type: "feed" },
        ])
    })
})

describe("ModalInterpreter - units", () => {
    it("converts inch coordinates (G20) to mm internally", () => {
        const model = new ToolpathModel()
        new ModalInterpreter(model).parse("G20\nG1 X1")

        expect(model.segments[0].end.x).toBeCloseTo(25.4, 6)
    })

    it("keeps mm coordinates (G21) unconverted", () => {
        const model = new ToolpathModel()
        new ModalInterpreter(model).parse("G21\nG1 X1")

        expect(model.segments[0].end.x).toBeCloseTo(1, 6)
    })
})

describe("ModalInterpreter - arcs (G17 plane)", () => {
    it("approximates a 90-degree G2 arc into 9 segments (10-degree step) ending at the target point", () => {
        const model = new ToolpathModel()
        new ModalInterpreter(model).parse("G2 X10 Y10 I10 J0")

        expect(model.segments).toHaveLength(9)
        const last = model.segments[model.segments.length - 1]
        expect(last.end.x).toBeCloseTo(10, 6)
        expect(last.end.y).toBeCloseTo(10, 6)
    })

    it("draws a full circle (36 segments) when the arc returns to its own start with no explicit P", () => {
        const model = new ToolpathModel()
        new ModalInterpreter(model).parse("G2 I10 J0")

        expect(model.segments).toHaveLength(36)
        const last = model.segments[model.segments.length - 1]
        expect(last.end.x).toBeCloseTo(0, 6)
        expect(last.end.y).toBeCloseTo(0, 6)
    })

    it("falls back to a straight feed segment when the arc has neither IJK nor R", () => {
        const model = new ToolpathModel()
        new ModalInterpreter(model).parse("G2 X10 Y10")

        expect(model.segments).toEqual([
            { start: { x: 0, y: 0, z: 0 }, end: { x: 10, y: 10, z: 0 }, type: "feed" },
        ])
    })

    it("resolves an arc center from R and reaches the target endpoint", () => {
        const model = new ToolpathModel()
        // Quarter circle of radius ~7.07 from (0,0) to (10,0) - center resolved from R.
        new ModalInterpreter(model).parse("G2 X10 Y0 R7.5")

        const last = model.segments[model.segments.length - 1]
        expect(last.end.x).toBeCloseTo(10, 6)
        expect(last.end.y).toBeCloseTo(0, 6)
    })
})

describe("ModalInterpreter - G92 offsets", () => {
    it("shifts subsequent segments by the G92 offset without moving the internal machine position", () => {
        const model = new ToolpathModel()
        new ModalInterpreter(model).parse("G92 X5 Y5\nG1 X10 Y10")

        expect(model.segments).toEqual([
            { start: { x: 5, y: 5, z: 0 }, end: { x: 15, y: 15, z: 0 }, type: "feed" },
        ])
    })

    it("removes the offset again after G92.1", () => {
        const model = new ToolpathModel()
        new ModalInterpreter(model).parse("G92 X5 Y5\nG92.1\nG1 X10 Y10")

        expect(model.segments).toEqual([
            { start: { x: 0, y: 0, z: 0 }, end: { x: 10, y: 10, z: 0 }, type: "feed" },
        ])
    })
})

describe("ModalInterpreter - maxSegments cutoff", () => {
    it("stops adding segments once the limit is reached and warns exactly once", () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
        const model = new ToolpathModel()
        new ModalInterpreter(model, { maxSegments: 2 }).parse("G1 X1\nG1 X2\nG1 X3")

        expect(model.segments).toHaveLength(2)
        expect(warnSpy).toHaveBeenCalledTimes(1)

        warnSpy.mockRestore()
    })
})
