// ModalInterpreter.ts
// Intérprete modal inspirado en MitchBradley toolpath.js (tablet-extension)
// Emite geometría "line segments" hacia ToolpathModel, sin mezclar render/UI.

import { ToolpathModel } from "./ToolpathModel"
import type { Point3D, SegmentType } from "../types/toolpath.types"
import type { ModalState } from "./ModalState"

// 10° como en tu parser actual (estilo Mitch)
const ARC_STEP_ANGLE = Math.PI / 18

type PlaneMode = "G17" | "G18" | "G19"
type MotionMode = "G0" | "G1" | "G2" | "G3"
type WordMap = Record<string, number | undefined>

const in2mm = (v: number) => v * 25.4

function stripComments(raw: string): string {
    // 1) elimina ( ... )
    let s = raw.replace(/\(.*?\)/g, "")
    // 2) elimina ; hasta fin de línea
    const semi = s.indexOf(";")
    if (semi >= 0) s = s.substring(0, semi)
    return s.trim()
}

function isFiniteNumber(v: any): v is number {
    return typeof v === "number" && Number.isFinite(v)
}

/**
 * Mapeo de ejes del plano:
 *  - a,b: ejes del plano del arco
 *  - c: eje perpendicular (helicoide)
 *  - i,j: letras de offset del centro según plano
 */
type PlaneAxes = {
    a: keyof Point3D
    b: keyof Point3D
    c: keyof Point3D
    i: "I" | "J" | "K"
    j: "I" | "J" | "K"
}

export class ModalInterpreter {
    private model: ToolpathModel
    private maxSegments?: number
    private stopParsing = false



    // Posición real (machine space interno para el intérprete)
    private machinePos: Point3D = { x: 0, y: 0, z: 0 }

    private modal: ModalState = {
        motion: "G0",
        plane: "G17",
        units: "mm",
        distance: "absolute",
        ijDistance: "incremental",
        g92Offset: { x: 0, y: 0, z: 0 },

    }

    constructor(
        model: ToolpathModel,
        options?: {
            maxSegments?: number
            onProgress?: (percent: number) => void
        }
    ) {

        this.model = model
        this.maxSegments = options?.maxSegments
    }


    reset() {
        this.machinePos = { x: 0, y: 0, z: 0 }
        this.modal = {
            motion: "G0",
            plane: "G17",
            units: "mm",
            distance: "absolute",
            ijDistance: "incremental",
            g92Offset: { x: 0, y: 0, z: 0 },
        }
    }

    parse(gcode: string): ToolpathModel {
        this.stopParsing = false
        this.reset()
        this.model.clear()

        const lines = gcode.split(/\r?\n/)
        for (const line of lines) {
            this.parseLine(line)
        }
        return this.model
    }

    parseLine(rawLine: string): void {
        const line = stripComments(rawLine)
        if (!line) return

        const words = this.tokenize(line)
        if (!words) return

        // 1) aplicar cambios modales (si hay)
        this.applyModalChanges(words)

        // 2) comandos especiales (G92 / G92.1)
        if (this.hasGCode(words, 92.1)) {
            this.cancelG92()
            return
        }
        if (this.hasGCode(words, 92)) {
            this.handleG92(words)
            return
        }

        // 3) movimiento: si hay X/Y/Z o si hay arco con I/J/K/R
        const hasXYZ =
            words.X !== undefined || words.Y !== undefined || words.Z !== undefined

        const isArc = this.modal.motion === "G2" || this.modal.motion === "G3"

        // incluir I/J/K/R para que el arco exista aunque no venga X/Y/Z explícito
        const hasArcParams =
            words.I !== undefined ||
            words.J !== undefined ||
            words.K !== undefined ||
            words.R !== undefined ||
            words.P !== undefined

        if (!hasXYZ && !(isArc && hasArcParams)) {
            // línea sin geometría (puede ser solo modal)
            return
        }

        if (this.modal.motion === "G0" || this.modal.motion === "G1") {
            this.handleLineMove(words)
            return
        }

        if (this.modal.motion === "G2" || this.modal.motion === "G3") {
            this.handleArcMove(words)
            return
        }
    }

    // ---------------------------
    // Tokenizer simple (words tipo X12.3, G38.2, etc.)
    // ---------------------------
    private tokenize(line: string): WordMap | null {
        // Soporta "G1X10Y10" y con espacios
        const matches = line.match(/[A-Za-z][+\-]?\d*\.?\d+/g)
        if (!matches || matches.length === 0) return null

        const out: WordMap = {}
        for (const tok of matches) {
            const letter = tok[0].toUpperCase()
            const numStr = tok.substring(1)
            const val = Number(numStr)
            if (Number.isNaN(val)) continue
            out[letter] = val
        }
        return out
    }

    private applyModalChanges(words: WordMap) {
        // Units
        if (this.hasGCode(words, 20)) this.modal.units = "inch"
        if (this.hasGCode(words, 21)) this.modal.units = "mm"

        // Distance
        if (this.hasGCode(words, 90)) this.modal.distance = "absolute"
        if (this.hasGCode(words, 91)) this.modal.distance = "incremental"

        // IJ Distance (independent of G90/G91)
        if (this.hasGCode(words, 90.1)) this.modal.ijDistance = "absolute"
        if (this.hasGCode(words, 91.1)) this.modal.ijDistance = "incremental"

        // Plane
        if (this.hasGCode(words, 17)) this.modal.plane = "G17"
        if (this.hasGCode(words, 18)) this.modal.plane = "G18"
        if (this.hasGCode(words, 19)) this.modal.plane = "G19"

        // Motion (modal)
        const g = words.G
        if (isFiniteNumber(g)) {
            const gcode = this.formatG(g)
            if (gcode === "G0" || gcode === "G1" || gcode === "G2" || gcode === "G3") {
                this.modal.motion = gcode
            }
        }
    }

    // ---------------------------
    // Moves
    // ---------------------------
    private handleLineMove(words: WordMap) {
        const start = { ...this.machinePos }
        const end: Point3D = {
            x: this.resolveAxis(this.machinePos.x, words.X),
            y: this.resolveAxis(this.machinePos.y, words.Y),
            z: this.resolveAxis(this.machinePos.z, words.Z),
        }

        const type: SegmentType = this.modal.motion === "G0" ? "rapid" : "feed"
        this.addLineWithG92(start, end, type)

        this.machinePos = end
    }

    private handleArcMove(words: WordMap) {
        const clockwise = this.modal.motion === "G2"
        const axes = this.getPlaneAxes(this.modal.plane)

        const start = { ...this.machinePos }
        const end: Point3D = {
            x: this.resolveAxis(this.machinePos.x, words.X),
            y: this.resolveAxis(this.machinePos.y, words.Y),
            z: this.resolveAxis(this.machinePos.z, words.Z),
        }

        // Proyección al plano 2D activo
        const p0 = { x: start[axes.a], y: start[axes.b] }
        const p1 = { x: end[axes.a], y: end[axes.b] }

        // Centro del arco (2D en el plano activo)
        let center: { x: number; y: number } | null = null

        // I/J/K relativos según plano (IJK siempre incremental por defecto: G91.1)
        // Si falta uno de los offsets, se asume 0.
        const offI = this.toMM(words[axes.i] ?? 0)
        const offJ = this.toMM(words[axes.j] ?? 0)

        const hasIJK =
            words[axes.i] !== undefined || words[axes.j] !== undefined

        if (hasIJK) {
            // I/J/K pueden ser incremental (G91.1) o absolute (G90.1)
            if (this.modal.ijDistance === "incremental") {
                center = { x: p0.x + offI, y: p0.y + offJ }
            } else {
                center = { x: offI, y: offJ }
            }
        } else if (words.R !== undefined) {
            center = this.computeCenterFromR(p0, p1, this.toMM(words.R), clockwise)
        }


        if (!center) {
            // Fallback seguro: si no podemos resolver el arco, lo dibujamos como línea
            this.addLineWithG92(start, end, "feed")
            this.machinePos = end
            return
        }

        // Helicoidal: eje perpendicular al plano
        const h0 = start[axes.c]
        const h1 = end[axes.c]

        const points2D = this.approximateArc2D(p0, p1, center, clockwise, words.P)

        let prev: Point3D = { ...start }

        for (let i = 0; i < points2D.length; i++) {
            const t = (i + 1) / points2D.length
            const h = h0 + (h1 - h0) * t

            const next: Point3D = { ...prev }
            next[axes.a] = points2D[i].x
            next[axes.b] = points2D[i].y
            next[axes.c] = h

            this.addLineWithG92(prev, next, "feed")
            prev = next
        }

        this.machinePos = end
    }

    // ---------------------------
    // G92 / G92.1 (modelo correcto)
    // machinePos + g92Offset = visualPos
    // ---------------------------
    private handleG92(words: WordMap) {
        const hasXYZ = words.X !== undefined || words.Y !== undefined || words.Z !== undefined

        // Mitch-style: G92 sin ejes => cancelar offsets actuales
        if (!hasXYZ) {
            this.cancelG92()
            return
        }

        // Para cada eje especificado:
        // visual = (machinePos + offset) debe pasar a ser valor dado (en mm)
        // => offset = newVisual - machinePos
        if (words.X !== undefined) {
            const newVisualX = this.toMM(words.X)
            this.modal.g92Offset.x = newVisualX - this.machinePos.x
        }
        if (words.Y !== undefined) {
            const newVisualY = this.toMM(words.Y)
            this.modal.g92Offset.y = newVisualY - this.machinePos.y
        }
        if (words.Z !== undefined) {
            const newVisualZ = this.toMM(words.Z)
            this.modal.g92Offset.z = newVisualZ - this.machinePos.z
        }
    }

    private cancelG92() {
        this.modal.g92Offset = { x: 0, y: 0, z: 0 }
    }

    // ---------------------------
    // Helpers: unidades / distancia
    // ---------------------------
    private toMM(v: number): number {
        return this.modal.units === "inch" ? in2mm(v) : v
    }

    /** Resuelve un eje con G90/G91 centralizado */
    private resolveAxis(current: number, raw: number | undefined): number {
        if (!isFiniteNumber(raw)) return current
        const vmm = this.toMM(raw)
        return this.modal.distance === "incremental" ? current + vmm : vmm
    }

    private addLineWithG92(start: Point3D, end: Point3D, type: SegmentType) {
        // ⛔ Si ya llegamos al límite, no agregamos más segmentos
        if (this.stopParsing) return

        const s = this.applyG92(start)
        const e = this.applyG92(end)

        this.model.addSegment({ start: s, end: e, type })

        // ⛔ Límite de segmentos (PC / Mobile)
        if (this.maxSegments && this.model.segments.length >= this.maxSegments) {
            console.warn(
                `[Toolpath] Segment limit reached (${this.maxSegments}). Parsing stopped.`
            )
            this.stopParsing = true
        }
    }



    private applyG92(p: Point3D): Point3D {
        return {
            x: p.x + this.modal.g92Offset.x,
            y: p.y + this.modal.g92Offset.y,
            z: p.z + this.modal.g92Offset.z,
        }
    }

    private hasGCode(words: WordMap, code: number): boolean {
        if (!isFiniteNumber(words.G)) return false
        return Math.abs(words.G - code) < 1e-6
    }

    private formatG(code: number): MotionMode | string {
        if (Math.abs(code - 0) < 1e-6) return "G0"
        if (Math.abs(code - 1) < 1e-6) return "G1"
        if (Math.abs(code - 2) < 1e-6) return "G2"
        if (Math.abs(code - 3) < 1e-6) return "G3"
        return `G${code}`
    }

    // Mapeo de ejes según plano activo (fase 1 correcto)
    private getPlaneAxes(plane: PlaneMode): PlaneAxes {
        switch (plane) {
            case "G17": // XY (I,J)
                return { a: "x", b: "y", c: "z", i: "I", j: "J" }
            case "G18": // XZ (I,K)
                return { a: "x", b: "z", c: "y", i: "I", j: "K" }
            case "G19": // YZ (J,K)
                return { a: "y", b: "z", c: "x", i: "J", j: "K" }
        }
    }

    /**
     * Resolver centro con R (radius).
     * Devuelve uno de los dos centros posibles según:
     * - sentido CW/CCW
     * - signo de R (R<0 suele forzar arco mayor)
     */
    private computeCenterFromR(
        p0: { x: number; y: number },
        p1: { x: number; y: number },
        r: number,
        clockwise: boolean
    ) {
        const dx = p1.x - p0.x
        const dy = p1.y - p0.y
        const d = Math.hypot(dx, dy)
        if (d < 1e-9) return null

        const rr = Math.abs(r)
        const h2 = 4 * rr * rr - d * d
        if (h2 < 0) return null

        let h = Math.sqrt(h2) / 2

        // Selección del lado (dos centros posibles)
        // Convención típica: invertir según CW/CCW y signo de R
        if (clockwise) h = -h
        if (r < 0) h = -h

        const mx = p0.x + dx / 2
        const my = p0.y + dy / 2

        const nx = -dy / d
        const ny = dx / d

        return {
            x: mx + nx * h,
            y: my + ny * h,
        }
    }

    // Arco genérico 2D (independiente de XY/XZ/YZ)
    private approximateArc2D(
        start: { x: number; y: number },
        end: { x: number; y: number },
        center: { x: number; y: number },
        clockwise: boolean,
        P?: number
    ) {
        const points: { x: number; y: number }[] = []

        const a0 = Math.atan2(start.y - center.y, start.x - center.x)
        const a1 = Math.atan2(end.y - center.y, end.x - center.x)

        // Delta base (sin forzar "arco corto": eso invertía arcos reales)
        let delta = a1 - a0

        // Ajuste de sentido CW / CCW
        if (clockwise) {
            if (delta > 0) delta -= Math.PI * 2
        } else {
            if (delta < 0) delta += Math.PI * 2
        }

        // Vueltas completas (P)
        const turns = Math.max(1, Math.floor(P ?? 1))
        if (turns > 1) {
            delta += (clockwise ? -1 : 1) * Math.PI * 2 * (turns - 1)
        }

        const steps = Math.max(2, Math.ceil(Math.abs(delta) / ARC_STEP_ANGLE))
        const r = Math.hypot(start.x - center.x, start.y - center.y)

        for (let i = 1; i <= steps; i++) {
            const a = a0 + (delta * i) / steps
            points.push({
                x: center.x + Math.cos(a) * r,
                y: center.y + Math.sin(a) * r,
            })
        }

        return points
    }
}
