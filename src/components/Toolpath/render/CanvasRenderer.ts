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

    render(
        model: ToolpathModel,
        view: ViewPreset,
        camera?: {
            zoom: number
            panX: number
            panY: number
        },
        toolPos?: { x: number; y: number; z: number },
        completedSegments: number = 0
    ) {
        const { width, height } = this.canvas
        const ctx = this.ctx

        // =========================
        // Fondo
        // =========================
        ctx.fillStyle = COLORS.background
        ctx.fillRect(0, 0, width, height)

        const bbox = model.bbox

        const centerX = (bbox.minX + bbox.maxX) / 2
        const centerY = (bbox.minY + bbox.maxY) / 2
        const centerZ = (bbox.minZ + bbox.maxZ) / 2

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

        const projected = corners3D.map(view.projection)

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

        const baseScale = Math.min(width / sizeX, height / sizeY) * 0.9
        const zoom = camera?.zoom ?? 1
        const scale = baseScale * zoom

        const center2DX = (minX + maxX) / 2
        const center2DY = (minY + maxY) / 2

        const panX = camera?.panX ?? 0
        const panY = camera?.panY ?? 0

        const offsetX = width / 2 - center2DX * scale + panX
        const offsetY = height / 2 - center2DY * scale + panY

        ctx.lineCap = "round"
        ctx.lineJoin = "round"

        // =========================
        // 🧭 Ejes
        // =========================
        if (view.showAxes) {
            this.drawAxes(view, scale, offsetX, offsetY)
        }

        // =========================
        // Toolpath con progreso
        // =========================
        model.segments.forEach((seg, index) => {
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

            const isCompleted = index < completedSegments

            if (isCompleted) {
                ctx.strokeStyle = COLORS.completed
                ctx.setLineDash([])
                ctx.lineWidth = 2.4
            } else if (seg.type === "rapid") {
                ctx.strokeStyle = COLORS.rapid
                ctx.setLineDash([5, 4])
                ctx.lineWidth = 1
            } else {
                ctx.strokeStyle = b3.z < 0 ? COLORS.feedCut : COLORS.feed
                ctx.setLineDash([])
                ctx.lineWidth = b3.z < 0 ? 2.2 : 1.6
            }

            ctx.beginPath()
            ctx.moveTo(offsetX + a2.x * scale, offsetY + a2.y * scale)
            ctx.lineTo(offsetX + b2.x * scale, offsetY + b2.y * scale)
            ctx.stroke()
        })

        ctx.setLineDash([])

        // =========================
        // 🔵 Toolhead
        // =========================
        if (toolPos) {
            const p3 = {
                x: toolPos.x - centerX,
                y: toolPos.y - centerY,
                z: toolPos.z - centerZ,
            }

            const p2 = view.projection(p3)

            const px = offsetX + p2.x * scale
            const py = offsetY + p2.y * scale

            ctx.fillStyle = COLORS.tool
            ctx.shadowColor = COLORS.toolGlow
            ctx.shadowBlur = 8

            ctx.beginPath()
            ctx.arc(px, py, 4, 0, Math.PI * 2)
            ctx.fill()

            ctx.shadowBlur = 0
        }
    }

    private drawAxes(
        view: ViewPreset,
        scale: number,
        offsetX: number,
        offsetY: number
    ) {
        const ctx = this.ctx
        const axisLength = 50 / scale

        const origin3D = { x: 0, y: 0, z: 0 }

        const axes = [
            { to: { x: axisLength, y: 0, z: 0 }, color: COLORS.axisX },
            { to: { x: 0, y: axisLength, z: 0 }, color: COLORS.axisY },
            { to: { x: 0, y: 0, z: axisLength }, color: COLORS.axisZ },
        ]

        const o2 = view.projection(origin3D)

        for (const axis of axes) {
            const p2 = view.projection(axis.to)

            ctx.strokeStyle = axis.color
            ctx.lineWidth = 2

            ctx.beginPath()
            ctx.moveTo(offsetX + o2.x * scale, offsetY + o2.y * scale)
            ctx.lineTo(offsetX + p2.x * scale, offsetY + p2.y * scale)
            ctx.stroke()
        }

        ctx.fillStyle = COLORS.origin
        ctx.beginPath()
        ctx.arc(offsetX + o2.x * scale, offsetY + o2.y * scale, 3, 0, Math.PI * 2)
        ctx.fill()
    }
}
