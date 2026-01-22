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

  // 🔵 Toolhead animado
  const [toolPos, setToolPos] = useState<{ x: number; y: number; z: number } | null>(null)

  // ▶️ Play / Pause
  const [playing, setPlaying] = useState(true)
  const playingRef = useRef(true)

  // ⏩ Velocidad (factor visual)
  const speedRef = useRef(1) // 1x = normal

  const rafRef = useRef<number | null>(null)

  // 🔄 sync state → ref
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
      undefined,
      toolPos ?? undefined
    )
  }, [viewIndex, toolPos])

  // ▶️ Animación del toolhead
  const animateToolhead = (model: ToolpathModel) => {
  let segIndex = 0
  let t = 0
  const baseSpeed = 0.02 // velocidad base

  const step = () => {
    // ⏸ Pause real
    if (!playingRef.current) {
      rafRef.current = requestAnimationFrame(step)
      return
    }

    const seg = model.segments[segIndex]
    if (!seg) return

    t += baseSpeed * speedRef.current

    // 🚫 NO renderizar este frame
    if (t >= 1) {
      t = 0
      segIndex++
      if (segIndex >= model.segments.length) return
      rafRef.current = requestAnimationFrame(step)
      return
    }

    // ✅ Render solo con t válido
    setToolPos({
      x: seg.start.x + (seg.end.x - seg.start.x) * t,
      y: seg.start.y + (seg.end.y - seg.start.y) * t,
      z: seg.start.z + (seg.end.z - seg.start.z) * t,
    })

    rafRef.current = requestAnimationFrame(step)
  }

  rafRef.current = requestAnimationFrame(step)
}


  return (
    <div class="panel panel-dashboard" id={id}>
      <ContainerHelper id={id} />

      {/* Navbar */}
      <div class="navbar">
        <span class="navbar-section feather-icon-container">
          <Eye />
          <strong class="text-ellipsis">{T("Toolpath")}</strong>
        </span>

        <span class="navbar-section">
          {/* ▶️ Play / Pause */}
          <button
            class="btn btn-link"
            title={playing ? "Pause" : "Play"}
            onClick={() => setPlaying(p => !p)}
          >
            {playing ? "⏸" : "▶"}
          </button>

          {/* ➖ Velocidad */}
          <button
            class="btn btn-link"
            title="Slower"
            onClick={() => {
              speedRef.current = Math.max(0.25, speedRef.current / 1.25)
            }}
          >
            −
          </button>

          <span
            style={{
              minWidth: 36,
              textAlign: "center",
              fontSize: "0.8em",
              opacity: 0.8,
            }}
          >
            {speedRef.current.toFixed(2)}x
          </span>

          {/* ➕ Velocidad */}
          <button
            class="btn btn-link"
            title="Faster"
            onClick={() => {
              speedRef.current = Math.min(4, speedRef.current * 1.25)
            }}
          >
            +
          </button>

          <PanelMenu items={[]} />
          <FullScreenButton elementId={id} />
          <CloseButton elementId={id} hideOnFullScreen />
        </span>
      </div>

      {/* Body */}
      <div class="panel-body panel-body-dashboard m-2">
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height: "100%",
            background: "#111",
            borderRadius: "6px",
          }}
          title="Click to change view"
          onClick={() =>
            setViewIndex(v => (v + 1) % VIEW_PRESETS.length)
          }
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
