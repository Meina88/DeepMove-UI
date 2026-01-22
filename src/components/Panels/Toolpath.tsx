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
; =========================
; TEST TOOLPATH – FASE 1
; G17 / G18 / G19 + G92
; =========================

G21         ; mm
G90         ; absoluto

; -------------------------
; Plano XY (G17)
; -------------------------
G17
G0 X0 Y0 Z5
G1 Z0 F300

; cuadrado base
G1 X40 Y0 F600
G1 X40 Y40
G1 X0  Y40
G1 X0  Y10

; arco CCW en XY
G3 X10 Y0 I10 J0

G0 Z5

; -------------------------
; G92 (nuevo cero visual)
; -------------------------
G92 X0 Y0 Z0

; -------------------------
; Plano XZ (G18)
; -------------------------
G18
G0 X0 Z5 Y20
G1 Z0 F300

; arco CW en XZ
G2 X20 Z-10 I10 K0

G0 Z5

; -------------------------
; Cancelar G92
; -------------------------
G92.1

; -------------------------
; Plano YZ (G19)
; -------------------------
G19
G0 Y0 Z5 X60
G1 Z0 F300

; arco CCW en YZ
G3 Y20 Z-10 J10 K0

G0 Z10

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
