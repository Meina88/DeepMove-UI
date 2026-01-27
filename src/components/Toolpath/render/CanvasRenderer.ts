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
    camera?: { zoom: number; panX: number; panY: number },
    toolPos?: { x: number; y: number; z: number },
    completedSegments: number = 0
  ) {
    const ctx = this.ctx

    const dpr = window.devicePixelRatio || 1
    const cssW = this.canvas.width / dpr
    const cssH = this.canvas.height / dpr

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, cssW, cssH)

    ctx.fillStyle = COLORS.background
    ctx.fillRect(0, 0, cssW, cssH)



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

    const sizeX = (maxX - minX) || 1
    const sizeY = (maxY - minY) || 1

    const baseScale = Math.min(cssW / sizeX, cssH / sizeY) * 0.9
    const zoom = camera?.zoom ?? 1
    const scale = baseScale * zoom

    const center2DX = (minX + maxX) / 2
    const center2DY = (minY + maxY) / 2

    const panX = camera?.panX ?? 0
    const panY = camera?.panY ?? 0

    const offsetX = cssW / 2 - center2DX * scale + panX
    const offsetY = cssH / 2 - center2DY * scale + panY
const gridPlane = this.getGridPlane(view.id)

if (gridPlane === "XY" && view.id === "top") {
  this.drawGridXY(ctx, view, scale, offsetX, offsetY)
} else {
  this.drawProjectedGrid(ctx, view, scale, offsetX, offsetY, gridPlane)
}



    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    const maxSeg = Math.min(model.segments.length, completedSegments)

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

      const isCompleted = index < maxSeg

      if (isCompleted) {
        ctx.strokeStyle = COLORS.completed
        ctx.lineWidth = 2.4
      } else if (seg.type === "rapid") {
        ctx.strokeStyle = COLORS.rapid
        ctx.setLineDash([5, 4])
        ctx.lineWidth = 1
      } else {
        ctx.strokeStyle = b3.z < 0 ? COLORS.feedCut : COLORS.feed
        ctx.lineWidth = b3.z < 0 ? 2.2 : 1.6
      }

      ctx.beginPath()
      ctx.moveTo(offsetX + a2.x * scale, offsetY + a2.y * scale)
      ctx.lineTo(offsetX + b2.x * scale, offsetY + b2.y * scale)
      ctx.stroke()
      ctx.setLineDash([])
    })

    if (toolPos) {
      const p3 = {
        x: toolPos.x - centerX,
        y: toolPos.y - centerY,
        z: toolPos.z - centerZ,
      }
      const p2 = view.projection(p3)

      ctx.fillStyle = COLORS.tool
      ctx.beginPath()
      ctx.arc(
        offsetX + p2.x * scale,
        offsetY + p2.y * scale,
        4,
        0,
        Math.PI * 2
      )
      ctx.fill()
    }

    if (view.showAxes) {
      this.drawCornerAxes(view)
    }
  }

  private getGridPlane(viewId: string): "XY" | "XZ" | "YZ" {
  switch (viewId) {
    case "top":
    case "oblique":
      return "XY"

    case "front":
      return "XZ"

    case "side":
      return "YZ"

    default:
      return "XY"
  }
}


  private drawGridXY(
    ctx: CanvasRenderingContext2D,
    view: ViewPreset,
    scale: number,
    offsetX: number,
    offsetY: number
  ) {
    if (view.id !== "top") return

    const GRID_MM = 10
    const GRID_MAJOR = 50

    const width = ctx.canvas.width
    const height = ctx.canvas.height

    const minX = (-offsetX) / scale
    const maxX = (width - offsetX) / scale
    const minY = (-offsetY) / scale
    const maxY = (height - offsetY) / scale

    ctx.save()

    for (let x = Math.floor(minX / GRID_MM) * GRID_MM; x <= maxX; x += GRID_MM) {
      ctx.beginPath()
      ctx.strokeStyle = x % GRID_MAJOR === 0 ? "#2c2c2c" : "#1f1f1f"
      ctx.lineWidth = x === 0 ? 2 : 1

      const sx = offsetX + x * scale
      ctx.moveTo(sx, 0)
      ctx.lineTo(sx, height)
      ctx.stroke()
    }

    for (let y = Math.floor(minY / GRID_MM) * GRID_MM; y <= maxY; y += GRID_MM) {
      ctx.beginPath()
      ctx.strokeStyle = y % GRID_MAJOR === 0 ? "#2c2c2c" : "#1f1f1f"
      ctx.lineWidth = y === 0 ? 2 : 1

      const sy = offsetY - y * scale
      ctx.moveTo(0, sy)
      ctx.lineTo(width, sy)
      ctx.stroke()
    }

    ctx.restore()
  }

private drawProjectedGrid(
  ctx: CanvasRenderingContext2D,
  view: ViewPreset,
  scale: number,
  offsetX: number,
  offsetY: number,
  plane: "XY" | "XZ" | "YZ"
)
 {
    const GRID_MINOR = 10
const GRID_MAJOR = GRID_MINOR * 5


    // tamaño del viewport en mundo (mm)
    const viewW = ctx.canvas.width / scale
    const viewH = ctx.canvas.height / scale

    // rango suficiente para cubrir pantalla
    const RANGE_X = viewW
    const RANGE_Y = viewH

// ─────────────────────────────
// SUB GRID (fino)
// ─────────────────────────────
ctx.strokeStyle = "rgba(255,255,255,0.07)"
ctx.lineWidth = plane === "XY" ? 1 : 1.6


// Líneas paralelas al eje principal (Y / Z según plano)
for (
  let y = Math.floor(-RANGE_Y / GRID_MINOR) * GRID_MINOR;
  y <= RANGE_Y;
  y += GRID_MINOR
) {
  const a3 =
    plane === "XY" ? { x: -RANGE_X, y, z: 0 } :
    plane === "XZ" ? { x: -RANGE_X, y: 0, z: y } :
                     { x: 0, y: -RANGE_Y, z: y }

  const b3 =
    plane === "XY" ? { x: RANGE_X, y, z: 0 } :
    plane === "XZ" ? { x: RANGE_X, y: 0, z: y } :
                     { x: 0, y: RANGE_Y, z: y }

  const a2 = view.projection(a3)
  const b2 = view.projection(b3)

  ctx.beginPath()
  ctx.moveTo(offsetX + a2.x * scale, offsetY + a2.y * scale)
  ctx.lineTo(offsetX + b2.x * scale, offsetY + b2.y * scale)
  ctx.stroke()
}

// Líneas paralelas al eje secundario (X / Y según plano)
for (
  let x = Math.floor(-RANGE_X / GRID_MINOR) * GRID_MINOR;
  x <= RANGE_X;
  x += GRID_MINOR
) {
  const a3 =
    plane === "XY" ? { x, y: -RANGE_Y, z: 0 } :
    plane === "XZ" ? { x, y: 0, z: -RANGE_Y } :
                     { x: 0, y: x, z: -RANGE_Y }

  const b3 =
    plane === "XY" ? { x, y: RANGE_Y, z: 0 } :
    plane === "XZ" ? { x, y: 0, z: RANGE_Y } :
                     { x: 0, y: x, z: RANGE_Y }

  const a2 = view.projection(a3)
  const b2 = view.projection(b3)

  ctx.beginPath()
  ctx.moveTo(offsetX + a2.x * scale, offsetY + a2.y * scale)
  ctx.lineTo(offsetX + b2.x * scale, offsetY + b2.y * scale)
  ctx.stroke()
}

// ─────────────────────────────
// GRID MAYOR
// ─────────────────────────────
ctx.strokeStyle = "rgba(255,255,255,0.14)"
ctx.lineWidth = 1.2

for (
  let y = Math.floor(-RANGE_Y / GRID_MAJOR) * GRID_MAJOR;
  y <= RANGE_Y;
  y += GRID_MAJOR
) {
  const a3 =
    plane === "XY" ? { x: -RANGE_X, y, z: 0 } :
    plane === "XZ" ? { x: -RANGE_X, y: 0, z: y } :
                     { x: 0, y: -RANGE_Y, z: y }

  const b3 =
    plane === "XY" ? { x: RANGE_X, y, z: 0 } :
    plane === "XZ" ? { x: RANGE_X, y: 0, z: y } :
                     { x: 0, y: RANGE_Y, z: y }

  const a2 = view.projection(a3)
  const b2 = view.projection(b3)

  ctx.beginPath()
  ctx.moveTo(offsetX + a2.x * scale, offsetY + a2.y * scale)
  ctx.lineTo(offsetX + b2.x * scale, offsetY + b2.y * scale)
  ctx.stroke()
}

for (
  let x = Math.floor(-RANGE_X / GRID_MAJOR) * GRID_MAJOR;
  x <= RANGE_X;
  x += GRID_MAJOR
) {
  const a3 =
    plane === "XY" ? { x, y: -RANGE_Y, z: 0 } :
    plane === "XZ" ? { x, y: 0, z: -RANGE_Y } :
                     { x: 0, y: x, z: -RANGE_Y }

  const b3 =
    plane === "XY" ? { x, y: RANGE_Y, z: 0 } :
    plane === "XZ" ? { x, y: 0, z: RANGE_Y } :
                     { x: 0, y: x, z: RANGE_Y }

  const a2 = view.projection(a3)
  const b2 = view.projection(b3)

  ctx.beginPath()
  ctx.moveTo(offsetX + a2.x * scale, offsetY + a2.y * scale)
  ctx.lineTo(offsetX + b2.x * scale, offsetY + b2.y * scale)
  ctx.stroke()
}
  ctx.stroke()
}



  // 🧭 Ejes proyectados pero anclados a pantalla
  // 🧭 Ejes proyectados pero anclados a pantalla
  private drawCornerAxes(view: ViewPreset) {
    const ctx = this.ctx
    const dpr = window.devicePixelRatio || 1
    const cssH = this.canvas.height / dpr

    const origin = { x: 0, y: 0, z: 0 }
    const axisLen = 1

    const axes = [
      { v: { x: axisLen, y: 0, z: 0 }, color: COLORS.axisX, label: "x", show: true },
      { v: { x: 0, y: axisLen, z: 0 }, color: COLORS.axisY, label: "y", show: true },
      {
        v: { x: 0, y: 0, z: axisLen },
        color: COLORS.axisZ,
        label: "z",
        show: view.id !== "top",
      },
    ]

    const o2 = view.projection(origin)

    const isoOffsetX =
      view.id === "oblique" || view.id === "iso" ? 8 : 0

    const baseX = 20 + isoOffsetX
    const baseY = cssH - 20
    const scale = 20

    ctx.save()
    ctx.lineWidth = 2

    // 🔤 estilo letras
    ctx.font = "10px system-ui, -apple-system, Segoe UI, Roboto, Arial"
    ctx.textBaseline = "middle"
    ctx.textAlign = "left"

    for (const axis of axes) {
      if (!axis.show) continue

      const p2 = view.projection(axis.v)

      const ex = baseX + (p2.x - o2.x) * scale
      const ey = baseY + (p2.y - o2.y) * scale

      // línea
      ctx.strokeStyle = axis.color
      ctx.beginPath()
      ctx.moveTo(baseX, baseY)
      ctx.lineTo(ex, ey)
      ctx.stroke()

      // ➡️ vector normalizado para offset del texto
      const vx = ex - baseX
      const vy = ey - baseY
      const len = Math.hypot(vx, vy) || 1
      const nx = vx / len
      const ny = vy / len

      const pad = 6
      ctx.fillStyle = axis.color
      ctx.fillText(
        axis.label,
        ex + nx * pad,
        ey + ny * pad
      )
    }

    ctx.restore()
  }

}
