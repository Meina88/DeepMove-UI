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
import { GCodeParser } from "../Toolpath"
import { CanvasRenderer } from "../Toolpath"
import { VIEW_PRESETS } from "../Toolpath/render/ViewPresets"

// GCode de prueba (FASE 2)
const TEST_GCODE = `
G21         
G90         
G17       

G0 Z5
G0 X5 Y0

G1 Z-1 F200

G1 X35 Y0 F400
G2 X40 Y5 I0 J5

G1 X40 Y35
G2 X35 Y40 I-5 J0

G1 X5 Y40
G2 X0 Y35 I0 J-5

G1 X0 Y5
G2 X5 Y0 I5 J0

G0 Z5
`

const ToolpathPanel: FunctionalComponent = () => {
  const id = "toolpathPanel"
  if (!useUiContextFn.getValue("showtoolpathpanel")) return null

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<CanvasRenderer | null>(null)
  const modelRef = useRef<ReturnType<GCodeParser["parse"]> | null>(null)

  const [viewIndex, setViewIndex] = useState(0)

// Inicialización del toolpath (una sola vez)
useEffect(() => {
  const canvas = canvasRef.current
  if (!canvas) return

  const parser = new GCodeParser()
  const model = parser.parse(TEST_GCODE)
  modelRef.current = model

  const renderer = new CanvasRenderer(canvas)
  rendererRef.current = renderer

  // ⚠️ Esperar a que el layout esté 100% resuelto
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      canvas.width = canvas.clientWidth
      canvas.height = canvas.clientHeight

      renderer.render(model, VIEW_PRESETS[viewIndex])
    })
  })
}, [])


  // Redibujar al cambiar la vista
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
