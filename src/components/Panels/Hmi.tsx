/*
 HMI.tsx - MillingStation HMI panel
*/

import type { FunctionalComponent } from "preact"
import { ContainerHelper, FullScreenButton } from "../Controls"
import { T } from "../Translations"
import {
  Monitor,
  RotateCw,
  Octagon,
  Terminal,
} from "preact-feather"
import { useState, useEffect } from "preact/hooks"
import { FilesPanel } from "./Files"
import { JogPanel } from "./JogCNC"
import { OverridesPanel } from "./OverridesCNC"
import { ToolpathPanel } from "./Toolpath"
import { useTargetCommands } from "../../hooks"
import { useTargetContext } from "../../targets"
import { useUiContextFn } from "../../contexts"
import { eventBus } from "../../hooks/eventBus"
import { DashboardIcon } from "../../targets/CNC/FluidNC/icons"
import { iconsTarget } from "../../targets"


const HMIPanel: FunctionalComponent = () => {
  const id = "hmiPanel"
  const [isFullScreen, setIsFullScreen] = useState(false)
  const SOFT_RESET = "\x18"
  const UNLOCK = "$X"
  const [activeSection, setActiveSection] = useState<string>("files")
  const { targetCommands } = useTargetCommands()
  const { status } = useTargetContext() as any
  const uiFn = useUiContextFn

  const machineState: string = status?.state ?? "Idle"
  const normalizedState = String(machineState).toLowerCase()
  const isAlarm = normalizedState.startsWith("alarm")
  const isIdle = normalizedState === "idle"

  const [isLatched, setIsLatched] = useState(false)
  const [resetBusy, setResetBusy] = useState(false)

  const exitFullscreen = () => {
    uiFn.haptic()

    if (document.fullscreenElement) {
      document.exitFullscreen?.()
    }
  }



  useEffect(() => {
    const handleFullScreenChange = () => {
      const element = document.getElementById(id)

      const isFs = document.fullscreenElement === element

      setIsFullScreen(isFs)
    }


    document.addEventListener("fullscreenchange", handleFullScreenChange)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullScreenChange)
    }
  }, [])

  useEffect(() => {
    if (isAlarm) {
      setIsLatched(true)
    }

    if (isIdle) {
      setIsLatched(false)
    }
  }, [isAlarm, isIdle])

  useEffect(() => {
    const id = eventBus.on(
      "hmi:play",
      () => {
        setActiveSection("overrides")
      },
      "hmi-play-listener"
    )

    return () => {
      eventBus.off("hmi:play", id)
    }
  }, [])

  useEffect(() => {
    const listenerId = eventBus.on(
      "hmi:toggleFullscreen",
      () => {
        const element = document.getElementById(id)
        if (!element) return

        if (document.fullscreenElement === element) {
          document.exitFullscreen?.()
        } else {
          element.requestFullscreen?.()
        }
      },
      "hmi-fullscreen-listener"
    )

    return () => {
      eventBus.off("hmi:toggleFullscreen", listenerId)
    }
  }, [])



  const onResetPress = () => {
    if (resetBusy) return

    setResetBusy(true)
    window.setTimeout(() => {
      setResetBusy(false)
    }, 350)

    uiFn.haptic([50, 80, 50, 80, 50])

    if (isAlarm) {
      targetCommands(SOFT_RESET)

      window.setTimeout(() => {
        targetCommands(UNLOCK)
      }, 120)

      return
    }

    targetCommands(SOFT_RESET)
  }


  return (
    <div
      class={`panel panel-dashboard panel-hmi ${isFullScreen ? "hmi-fullscreen hmi-landscape-lock" : ""
        }`}
      id={id}
    >

      <ContainerHelper id={id} />

      <header class="navbar">
        <span class="navbar-section">
          <span class="feather-icon-container">
            <Monitor />
          </span>
          <strong class="text-ellipsis" style={{ marginLeft: "0.4rem" }}>
            {T("HMI")}
          </strong>
        </span>

        <span class="navbar-section">

          {/* Botón Panels (minimizar) — solo si está fullscreen */}
          {isFullScreen && (
            <button
              class="hmi-panels-btn"
              onClick={exitFullscreen}
              title="Exit HMI Fullscreen"
            >
              <DashboardIcon height="1em" />
              <span style={{ marginLeft: "6px" }}>
                Panels
              </span>
            </button>
          )}
        </span>
      </header>

      {isFullScreen && (
        <div class="panel-body panel-body-dashboard hmi-root">

          {/* Overlay Portrait */}
          <div class="hmi-portrait-warning">
            <div class="hmi-portrait-warning-content">
              <div class="hmi-portrait-icon">
                <RotateCw size={60} />
              </div>

              <div class="hmi-portrait-text">
                {T("S253")}
              </div>
            </div>
          </div>

          <div class="hmi-layout">


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

            </div>

            {/* TOOLPATH */}
            <div class="hmi-toolpath">
              <div class="hmi-embedded-panel">
                <ToolpathPanel embedded />
              </div>
            </div>


            {/* FOOTER */}
            <div class="hmi-footer">
              <div class="hmi-footer-nav">

                <button
                  class={`hmi-nav-btn ${activeSection === "jog" ? "is-active" : ""}`}
                  onClick={() => setActiveSection("jog")}
                >
                  {iconsTarget.Joystick}
                  <span>Jog</span>
                </button>

                <button
                  class={`hmi-nav-btn ${activeSection === "files" ? "is-active" : ""}`}
                  onClick={() => setActiveSection("files")}
                >
                  {iconsTarget.SDCard}
                  <span>Files</span>
                </button>

                <button
                  class={`hmi-nav-btn ${activeSection === "overrides" ? "is-active" : ""}`}
                  onClick={() => setActiveSection("overrides")}
                >
                  {iconsTarget.Mixer}
                  <span>Overrides</span>
                </button>

<button
  class={
    "hmi-nav-btn hmi-nav-btn-reset" +
    (isLatched ? " is-locked" : "") +
    (resetBusy ? " is-busy" : "")
  }

                  aria-pressed={isLatched}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onResetPress()
                  }}
                >
                  <Octagon size={18} />
                  <span>Reset</span>
                </button>

                <button
                  class={`hmi-nav-btn ${activeSection === "outputs" ? "is-active" : ""}`}
                  onClick={() => setActiveSection("outputs")}
                >
                  {iconsTarget.Outputs}
                  <span>Outputs</span>
                </button>

                <button
                  class={`hmi-nav-btn ${activeSection === "terminal" ? "is-active" : ""}`}
                  onClick={() => setActiveSection("terminal")}
                >
                  <Terminal size={18} />
                  <span>Terminal</span>
                </button>

                <button
                  class={`hmi-nav-btn ${activeSection === "probe" ? "is-active" : ""}`}
                  onClick={() => setActiveSection("probe")}
                >
                  {iconsTarget.Diamond}
                  <span>Probe</span>
                </button>

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
  icon: "Monitor",
  show: "showhmipanel",
  onstart: "openhmionstart",
  settingid: "hmi",
}

export { HMIPanel, HMIPanelElement }
