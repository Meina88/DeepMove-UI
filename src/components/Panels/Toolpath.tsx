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

// Toolpath engine
import { CanvasRenderer } from "../Toolpath"
import { VIEW_PRESETS } from "../Toolpath/render/ViewPresets"

// 👉 NUEVOS imports (parser modal real)
import { ToolpathModel } from "../Toolpath/core/ToolpathModel"
import { ModalInterpreter } from "../Toolpath/core/ModalInterpreter"

// GCode de prueba (FASE 2)
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

  // 🔹 Inicialización del toolpath (una sola vez)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // 👉 Crear modelo + intérprete modal
    const model = new ToolpathModel()
    const interpreter = new ModalInterpreter(model)
    interpreter.parse(TEST_GCODE)

    modelRef.current = model

    // Renderer
    const renderer = new CanvasRenderer(canvas)
    rendererRef.current = renderer

    // Esperar layout resuelto
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        canvas.width = canvas.clientWidth
        canvas.height = canvas.clientHeight

        renderer.render(model, VIEW_PRESETS[viewIndex])
      })
    })
  }, [])

  // 🔹 Redibujar al cambiar la vista
  useEffect(() => {
    const canvas = canvasRef.current
    const renderer = rendererRef.current
    const model = modelRef.current

    if (!canvas || !renderer || !model) return

    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight

    renderer.render(model, VIEW_PRESETS[viewIndex])
  }, [viewIndex])

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
            cursor: "pointer",
          }}
          title="Tap to change view"
          onClick={() =>
            setViewIndex((v) => (v + 1) % VIEW_PRESETS.length)
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
