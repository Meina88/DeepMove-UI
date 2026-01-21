import { ToolpathModel } from "../core/ToolpathModel"
import { ViewPreset } from "../types/toolpath.types"
import { COLORS } from "./Colors"

export class CanvasRenderer {
    private ctx: CanvasRenderingContext2D

    constructor(private canvas: HTMLCanvasElement) {
        const ctx = canvas.getContext("2d")
        if (!ctx) throw new Error("Canvas 2D not supported")
        this.ctx = ctx
    }

    render(model: ToolpathModel, view: ViewPreset) {
        const { width, height } = this.canvas
        const ctx = this.ctx

        // =========================
        // Fondo
        // =========================
        ctx.fillStyle = COLORS.background
        ctx.fillRect(0, 0, width, height)

        const bbox = model.bbox

        // Centro del bbox 3D (criterio Mitch)
        const centerX = (bbox.minX + bbox.maxX) / 2
        const centerY = (bbox.minY + bbox.maxY) / 2
        const centerZ = (bbox.minZ + bbox.maxZ) / 2

        // Esquinas del bbox (recentradas)
        const corners3D = [
            { x: bbox.minX - centerX, y: bbox.minY - centerY, z: bbox.minZ - centerZ },
            { x: bbox.maxX - centerX, y: bbox.minY - centerY, z: bbox.minZ - centerZ },
            { x: bbox.minX - centerX, y: bbox.maxY - centerY, z: bbox.minZ - centerZ },
            { x: bbox.maxX - centerX, y: bbox.maxY - centerY, z: bbox.minZ - centerZ },
            { x: bbox.minX - centerX, y: bbox.minY - centerY, z: bbox.maxZ - centerZ },
            { x: bbox.maxX - centerX, y: bbox.minY - centerY, z: bbox.maxZ - centerZ },
            { x: bbox.minX - centerX, y: bbox.maxY - centerY, z: bbox.maxZ - centerZ },
            { x: bbox.maxX - centerX, y: bbox.maxY - centerY, z: bbox.maxZ - centerZ },
        ]

        // Proyectar esquinas
        const projected = corners3D.map(view.projection)

        // Bounding box proyectado (2D)
        let minX = Infinity, maxX = -Infinity
        let minY = Infinity, maxY = -Infinity

        for (const p of projected) {
            minX = Math.min(minX, p.x)
            maxX = Math.max(maxX, p.x)
            minY = Math.min(minY, p.y)
            maxY = Math.max(maxY, p.y)
        }

        const sizeX = maxX - minX || 1
        const sizeY = maxY - minY || 1

        // Scale automático (fit-to-bounds)
        const scale = Math.min(
            width / sizeX,
            height / sizeY
        ) * 0.9   // margen tipo Mitch

        // Centro del bbox proyectado
        const center2DX = (minX + maxX) / 2
        const center2DY = (minY + maxY) / 2

        // Offset correcto para centrar el contenido
        const offsetX = width / 2 - center2DX * scale
        const offsetY = height / 2 - center2DY * scale


        // =========================
        // 🧭 Ejes + origen
        // =========================
        if (view.showAxes) {
            this.drawAxes(view, scale, offsetX, offsetY)
        }

        // =========================
        // Toolpath
        // =========================
        for (const seg of model.segments) {
            const a3 = {
                x: seg.start.x - centerX,
                y: seg.start.y - centerY,
                z: seg.start.z - centerZ,
            }
            const b3 = {
                x: seg.end.x - centerX,
                y: seg.end.y - centerY,
                z: seg.end.z - centerZ,
            }

            const a2 = view.projection(a3)
            const b2 = view.projection(b3)

            // 🔹 Estilo según tipo de movimiento
            if (seg.type === "rapid") {
                ctx.strokeStyle = COLORS.rapid
                ctx.setLineDash([6, 4])   // G0 → punteado
            } else {
                ctx.strokeStyle = COLORS.feed
                ctx.setLineDash([])      // G1/G2/G3 → continuo
            }

            ctx.lineWidth = 1.5

            ctx.beginPath()
            ctx.moveTo(offsetX + a2.x * scale, offsetY + a2.y * scale)
            ctx.lineTo(offsetX + b2.x * scale, offsetY + b2.y * scale)
            ctx.stroke()
        }

        // 🔑 Importante: resetear dash para no contaminar ejes/origen
        ctx.setLineDash([])

        // =========================
        // 🔵 Tool head (punto actual)
        // =========================
        const lastSeg = model.segments[model.segments.length - 1]
        if (lastSeg) {
            const p3 = {
                x: lastSeg.end.x - centerX,
                y: lastSeg.end.y - centerY,
                z: lastSeg.end.z - centerZ,
            }

            const p2 = view.projection(p3)

            const px = offsetX + p2.x * scale
            const py = offsetY + p2.y * scale

            ctx.fillStyle = COLORS.feed
            ctx.strokeStyle = "#000"
            ctx.lineWidth = 1

            ctx.beginPath()
            ctx.arc(px, py, 4, 0, Math.PI * 2)
            ctx.fill()
            ctx.stroke()
        }

    }

    // =========================
    // 🧭 Dibujo de ejes + origen
    // =========================
    private drawAxes(
        view: ViewPreset,
        scale: number,
        offsetX: number,
        offsetY: number
    ) {
        const ctx = this.ctx

        // Longitud visual constante (en unidades de mundo)
        const axisLength = 50 / scale

        const origin3D = { x: 0, y: 0, z: 0 }

        const axes = [
            { to: { x: axisLength, y: 0, z: 0 }, color: COLORS.axisX }, // X
            { to: { x: 0, y: axisLength, z: 0 }, color: COLORS.axisY }, // Y
            { to: { x: 0, y: 0, z: axisLength }, color: COLORS.axisZ }, // Z
        ]

        const o2 = view.projection(origin3D)

        for (const axis of axes) {
            const p2 = view.projection(axis.to)

            ctx.strokeStyle = axis.color
            ctx.lineWidth = 2

            ctx.beginPath()
            ctx.moveTo(
                offsetX + o2.x * scale,
                offsetY + o2.y * scale
            )
            ctx.lineTo(
                offsetX + p2.x * scale,
                offsetY + p2.y * scale
            )
            ctx.stroke()
        }

        // Origen
        ctx.fillStyle = COLORS.origin
        ctx.beginPath()
        ctx.arc(
            offsetX + o2.x * scale,
            offsetY + o2.y * scale,
            3,
            0,
            Math.PI * 2
        )
        ctx.fill()
    }
}
