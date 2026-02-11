/*
 HMI.tsx - MillingStation HMI panel
*/

import type { FunctionalComponent } from "preact"
import { ContainerHelper, FullScreenButton } from "../Controls"
import { T } from "../Translations"
import { Upload } from "preact-feather"
import { useState, useEffect } from "preact/hooks"
import { FilesPanel } from "./Files"
import { JogPanel } from "./JogCNC"
import { OverridesPanel } from "./OverridesCNC"
import { ToolpathPanel } from "./Toolpath"




const HMIPanel: FunctionalComponent = () => {
  const id = "hmiPanel"
  const [isFullScreen, setIsFullScreen] = useState(false)

  // 👇 todo en minúscula
  const [activeSection, setActiveSection] = useState<string>("files")

  useEffect(() => {
    const handleFullScreenChange = () => {
      const isFs = document.fullscreenElement?.id === id
      setIsFullScreen(!!isFs)
    }

    document.addEventListener("fullscreenchange", handleFullScreenChange)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange)
    }
  }, [])


  return (
    <div class={`panel panel-dashboard panel-hmi ${isFullScreen ? "hmi-fullscreen" : ""}`} id={id}>
      <ContainerHelper id={id} />

      <header class="navbar">
        <span class="navbar-section">
          <span class="feather-icon-container">
            <Upload />
          </span>
          <strong class="text-ellipsis" style={{ marginLeft: "0.4rem" }}>
            {T("HMI")}
          </strong>
        </span>

        <span class="navbar-section">
          <span class="full-height">
            <FullScreenButton elementId={id} />


          </span>
        </span>
      </header>

      {isFullScreen && (
        <div class="panel-body panel-body-dashboard hmi-root">

          <div class="hmi-layout">

            {/* HEADER */}
            <div class="hmi-header">
              <span class="hmi-header-title">Header</span>
            </div>

            {/* LEFT */}
            <div class="hmi-left">

              {/* Contenido dinámico */}
              <div class="hmi-left-content">

                {activeSection === "files" && (
                  <div class="hmi-embedded-panel">
                    <FilesPanel embedded />
                  </div>
                )}

                {activeSection === "jog" && (
                  <div class="hmi-embedded-panel">
                    <JogPanel embedded />
                  </div>
                )}

                {activeSection === "overrides" && (
                  <div class="hmi-embedded-panel">
                    <OverridesPanel embedded />
                  </div>
                )}

                {!["files", "jog", "overrides"].includes(activeSection) && (
                  <div class="hmi-zone-label">
                    {activeSection}
                  </div>
                )}

              </div>


              {/* Botones */}
              <div class="hmi-left-buttons">

                <button
                  class={`hmi-nav-btn ${activeSection === "jog" ? "is-active" : ""}`}
                  onClick={() => setActiveSection("jog")}
                >
                  J
                </button>

                <button
                  class={`hmi-nav-btn ${activeSection === "files" ? "is-active" : ""}`}
                  onClick={() => setActiveSection("files")}
                >
                  F
                </button>

                <button
                  class={`hmi-nav-btn ${activeSection === "overrides" ? "is-active" : ""}`}
                  onClick={() => setActiveSection("overrides")}
                >
                  Ov
                </button>

                <button
                  class={`hmi-nav-btn ${activeSection === "outputs" ? "is-active" : ""}`}
                  onClick={() => setActiveSection("outputs")}
                >
                  Ou
                </button>

                <button
                  class={`hmi-nav-btn ${activeSection === "terminal" ? "is-active" : ""}`}
                  onClick={() => setActiveSection("terminal")}
                >
                  T
                </button>

                <button
                  class={`hmi-nav-btn ${activeSection === "probe" ? "is-active" : ""}`}
                  onClick={() => setActiveSection("probe")}
                >
                  P
                </button>

              </div>
            </div>

            {/* TOOLPATH */}
            <div class="hmi-toolpath">
              <div class="hmi-embedded-panel">
                <ToolpathPanel embedded />
              </div>
            </div>


            {/* FOOTER */}
            <div class="hmi-footer">
              <div class="hmi-zone-label">
                Footer
              </div>
            </div>

          </div>
        </div>
      )}
    </div>

  )
}

const HMIPanelElement = {
  id: "hmiPanel",
  content: <HMIPanel />,
  name: "Hmi",
  icon: "Upload",
  show: "showhmipanel",
  onstart: "openhmionstart",
  settingid: "hmi",
}

export { HMIPanel, HMIPanelElement }
