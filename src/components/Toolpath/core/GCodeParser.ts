import { GCodeState } from "./GCodeState"
import { ToolpathModel } from "./ToolpathModel"
import { SegmentType } from "../types/toolpath.types"

// Paso angular del arco (criterio Mitch)
const ARC_STEP_ANGLE = Math.PI / 18 // 10°

export class GCodeParser {
    parse(gcode: string): ToolpathModel {
        const model = new ToolpathModel()
        const state = new GCodeState()

        const lines = gcode.split(/\r?\n/)

        // Primera pasada: bounding box
        state.reset()
        for (const raw of lines) {
            this.processLine(raw, state, model, true)
        }

        // Segunda pasada: segmentos
        state.reset()
        model.clear()
        for (const raw of lines) {
            this.processLine(raw, state, model, false)
        }

        return model
    }

    private processLine(
        rawLine: string,
        state: GCodeState,
        model: ToolpathModel,
        bboxOnly: boolean
    ) {
        const line = rawLine.replace(/\(.*?\)/g, "").trim()
        if (!line) return

        const words = line.split(/\s+/)

        let gcode: number | null = null
        const target: any = {}
        let I: number | null = null
        let J: number | null = null

        for (const w of words) {
            const letter = w[0].toUpperCase()
            const value = parseFloat(w.substring(1))

            if (letter === "G") {
                gcode = value
                if (value === 90) state.absoluteMode = true
                if (value === 91) state.absoluteMode = false
                if (value === 20) state.inchMode = true
                if (value === 21) state.inchMode = false
            }

            if (letter === "X") target.x = value
            if (letter === "Y") target.y = value
            if (letter === "Z") target.z = value
            if (letter === "I") I = value
            if (letter === "J") J = value
        }

        // =========================
        // G0 / G1 (lineal)
        // =========================
        if (gcode === 0 || gcode === 1) {
            const moveType: SegmentType = gcode === 0 ? "rapid" : "feed"

            const start = { ...state.position }
            const end = state.moveTo(target)

            if (bboxOnly) {
                model.bbox.expand(start)
                model.bbox.expand(end)
            } else {
                model.addSegment({ start, end, type: moveType })
            }

            state.position = end
            return
        }

        // =========================
        // G2 / G3 (arco por aproximación)
        // =========================
        if ((gcode === 2 || gcode === 3) && I !== null && J !== null) {
            const clockwise = gcode === 2

            const start = { ...state.position }
            const end = state.moveTo(target)

            const center = {
                x: start.x + I,
                y: start.y + J,
            }

            const arcPoints = this.approximateArc(
                start,
                end,
                center,
                clockwise
            )

            let prev = { ...start }

            for (const p of arcPoints) {
                if (bboxOnly) {
                    model.bbox.expand(prev)
                    model.bbox.expand(p)
                } else {
                    model.addSegment({
                        start: { ...prev },
                        end: { ...p },
                        type: "feed",
                    })
                }
                prev = p
            }

            state.position = end
            return
        }
    }

    // =========================
    // Aproximación de arco (estilo Mitch)
    // =========================
    private approximateArc(
        start: { x: number; y: number; z: number },
        end: { x: number; y: number; z: number },
        center: { x: number; y: number },
        clockwise: boolean
    ) {
        const points: { x: number; y: number; z: number }[] = []

        const sx = start.x - center.x
        const sy = start.y - center.y
        const ex = end.x - center.x
        const ey = end.y - center.y

let startAngle = Math.atan2(sy, sx)
let endAngle = Math.atan2(ey, ex)

const TWO_PI = Math.PI * 2

// Normalizar a [0, 2π)
const norm = (a: number) => (a < 0 ? a + TWO_PI : a)

const a0 = norm(startAngle)
const a1 = norm(endAngle)

let delta: number

if (clockwise) {
    // Distancia horaria (positiva), luego la hacemos negativa para avanzar CW
    let d = a0 - a1
    if (d <= 0) d += TWO_PI
    delta = -d
} else {
    // Distancia antihoraria (positiva)
    let d = a1 - a0
    if (d <= 0) d += TWO_PI
    delta = d
}

// Importante: usar el ángulo normalizado como base de integración
startAngle = a0

        const steps = Math.max(2, Math.ceil(Math.abs(delta) / ARC_STEP_ANGLE))
        const step = delta / steps

        const radius = Math.hypot(sx, sy)

        for (let i = 1; i <= steps; i++) {
            const a = startAngle + step * i
            points.push({
                x: center.x + Math.cos(a) * radius,
                y: center.y + Math.sin(a) * radius,
                z: start.z, // sin helicoidal (igual que Mitch)
            })
        }

        return points
    }
}
