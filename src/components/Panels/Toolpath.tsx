/*
 Toolpath.tsx - ESP3D WebUI custom panel
*/

import { FunctionalComponent } from "preact"
import { useEffect, useRef, useState } from "preact/hooks"

import { T } from "../Translations"
import { ContainerHelper, FullScreenButton, CloseButton } from "../Controls"
import { Menu as PanelMenu } from "./"
import { Eye } from "preact-feather"
import { useUiContextFn } from "../../contexts"

import { CanvasRenderer } from "../Toolpath"
import { VIEW_PRESETS } from "../Toolpath/render/ViewPresets"

import { ToolpathModel } from "../Toolpath/core/ToolpathModel"
import { ModalInterpreter } from "../Toolpath/core/ModalInterpreter"

// GCode de prueba
const TEST_GCODE = `
G21
G90
G17

G0 Z10
G0 X0 Y0

G1 Z0 F300
G1 X40 Y0 F600
G1 X40 Y40
G1 X0 Y40
G1 X0 Y0

G1 Z-3 F200
G2 X40 Y0 I20 J0
G2 X40 Y40 I0 J20
G2 X0 Y40 I-20 J0
G2 X0 Y0 I0 J-20

G0 Z10
M30
`

const ToolpathPanel: FunctionalComponent = () => {
  const id = "toolpathPanel"
  if (!useUiContextFn.getValue("showtoolpathpanel")) return null

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<CanvasRenderer | null>(null)
  const modelRef = useRef<ToolpathModel | null>(null)

  const [viewIndex, setViewIndex] = useState(0)

  // 🔵 Toolhead
  const [toolPos, setToolPos] = useState<{ x: number; y: number; z: number } | null>(null)

  // ▶️ Play / Pause
  const [playing, setPlaying] = useState(true)
  const playingRef = useRef(true)

  // ⏩ Velocidad visual
  const speedRef = useRef(1)

  // RAF
  const rafRef = useRef<number | null>(null)

  // Estado interno de animación
  const segIndexRef = useRef(0)
  const tRef = useRef(0)

  // 🟦 Progreso de segmentos completados
  const completedSegRef = useRef<number>(-1)

  // sync state → ref
  useEffect(() => {
    playingRef.current = playing
  }, [playing])

  // 🔹 Init
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const model = new ToolpathModel()
    new ModalInterpreter(model).parse(TEST_GCODE)

    modelRef.current = model
    rendererRef.current = new CanvasRenderer(canvas)

    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight

    const first = model.segments[0]
    if (first) setToolPos({ ...first.start })

    animateToolhead(model)
  }, [])

  // 🔁 Redraw
useEffect(() => {
  const renderer = rendererRef.current
  const model = modelRef.current
  if (!renderer || !model) return

  renderer.render(
    model,
    VIEW_PRESETS[viewIndex],
    undefined,                      // 👈 camera (todavía no usás zoom/pan acá)
    toolPos ?? undefined,           // 👈 toolhead
    completedSegRef.current + 1     // 👈 segmentos completados
  )
}, [viewIndex, toolPos])


  // ▶️ Animación
  const animateToolhead = (model: ToolpathModel) => {
    const baseSpeed = 0.02

    const step = () => {
      if (!playingRef.current) {
        rafRef.current = requestAnimationFrame(step)
        return
      }

      const seg = model.segments[segIndexRef.current]
      if (!seg) return

      tRef.current += baseSpeed * speedRef.current

      // avanzar de segmento
      if (tRef.current >= 1) {
        completedSegRef.current = segIndexRef.current // 👈 marcar completado
        tRef.current = 0
        segIndexRef.current++

        if (segIndexRef.current >= model.segments.length) {
          rafRef.current = null
          setPlaying(false)
          return
        }

        rafRef.current = requestAnimationFrame(step)
        return
      }

      setToolPos({
        x: seg.start.x + (seg.end.x - seg.start.x) * tRef.current,
        y: seg.start.y + (seg.end.y - seg.start.y) * tRef.current,
        z: seg.start.z + (seg.end.z - seg.start.z) * tRef.current,
      })

      rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)
  }

  const startAnimation = () => {
    const model = modelRef.current
    if (!model) return
    if (rafRef.current !== null) return
    animateToolhead(model)
  }

  // ⏹ Stop / Reset
  const stopAndReset = () => {
    setPlaying(false)

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }

    segIndexRef.current = 0
    tRef.current = 0
    completedSegRef.current = -1

    const first = modelRef.current?.segments[0]
    if (first) setToolPos({ ...first.start })
  }

  return (
    <div class="panel panel-dashboard" id={id}>
      <ContainerHelper id={id} />

      <div class="navbar">
        <span class="navbar-section feather-icon-container">
          <Eye />
          <strong class="text-ellipsis">{T("Toolpath")}</strong>
        </span>

        <span class="navbar-section">
          <button class="btn btn-link" onClick={stopAndReset}>⏹</button>

          <button
            class="btn btn-link"
            onClick={() => {
              setPlaying(p => {
                const next = !p
                if (next) startAnimation()
                return next
              })
            }}
          >
            {playing ? "⏸" : "▶"}
          </button>

          <button class="btn btn-link" onClick={() => speedRef.current = Math.max(0.25, speedRef.current / 1.25)}>−</button>
          <span style={{ minWidth: 36, textAlign: "center", fontSize: "0.8em" }}>
            {speedRef.current.toFixed(2)}x
          </span>
          <button class="btn btn-link" onClick={() => speedRef.current = Math.min(4, speedRef.current * 1.25)}>+</button>

          <PanelMenu items={[]} />
          <FullScreenButton elementId={id} />
          <CloseButton elementId={id} hideOnFullScreen />
        </span>
      </div>

      <div class="panel-body panel-body-dashboard m-2">
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: "100%", background: "#111", borderRadius: "6px" }}
          onClick={() => setViewIndex(v => (v + 1) % VIEW_PRESETS.length)}
        />
      </div>
    </div>
  )
}

const ToolpathPanelElement = {
  id: "toolpathPanel",
  content: <ToolpathPanel />,
  name: "Toolpath",
  icon: "GitCommit",
  show: "showtoolpathpanel",
  onstart: "opentoolpathonstart",
  settingid: "toolpath",
}

export { ToolpathPanel, ToolpathPanelElement }
