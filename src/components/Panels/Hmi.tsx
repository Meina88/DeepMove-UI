/*
 HMI.tsx - MillingStation HMI panel
*/

import type { FunctionalComponent } from "preact"
import { ContainerHelper, FullScreenButton, Button } from "../Controls"
import { T } from "../Translations"
import {
  Monitor,
  RotateCw,
  Octagon,
  Terminal,
  Power,
} from "preact-feather"
import { useState, useEffect, useRef } from "preact/hooks"
import { FilesPanel } from "./Files"
import { JogPanel } from "./JogCNC"
import { OverridesPanel } from "./OverridesCNC"
import { ToolpathPanel } from "./Toolpath"
import { TerminalPanel } from "./Terminal"
import { SpindlePanel } from "./SpindleCNC"
import { ProbePanel } from "./ProbeCNC"
import { useTargetCommands } from "../../hooks"
import { useTargetContext } from "../../targets"
import { useUiContextFn } from "../../contexts"
import { eventBus } from "../../hooks/eventBus"
import { DashboardIcon } from "../../targets/CNC/FluidNC/icons"
import { iconsTarget } from "../../targets"
import { useModalsContext } from "../../contexts"
import { useHttpQueue } from "../../hooks"
import { useWebSocketService } from "../../hooks/useWebSocketService"
import { espHttpURL } from "../Helpers"
import { showConfirmationModal } from "../Modal"
import { TargetedMouseEvent } from "preact"


const HMIPanel: FunctionalComponent = () => {
  const id = "hmiPanel"
  const [isFullScreen, setIsFullScreen] = useState(false)
  const SOFT_RESET = "\x18"
  const UNLOCK = "$X"
  const [activeSection, setActiveSection] = useState<string>("files")
  const { targetCommands } = useTargetCommands()
  const { status } = useTargetContext() as any
  const uiFn = useUiContextFn
  const { modals } = useModalsContext()
  const { createNewRequest } = useHttpQueue()
  const webSocketService = useWebSocketService()

  const lastValidState = useRef<string>("Offline")

  const machineState: string = status?.state ?? "Idle"
  const normalizedState = String(machineState).toLowerCase()
  const isAlarm = normalizedState.startsWith("alarm")
  const isIdle = normalizedState === "idle"
  const rawState = status?.state
  if (rawState && rawState !== "?") {
    lastValidState.current = rawState
  }
  const effectiveState =
    !rawState || rawState === "?"
      ? lastValidState.current
      : rawState

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

  const reloadPage = () => {
    uiFn.haptic()
    window.location.reload()
  }

  const powerOffNow = () => {
    uiFn.haptic()
    targetCommands("M62 P0")
  }

  const onPowerOff = () => {
    uiFn.haptic()
    showConfirmationModal({
      modals,
      title: T("S246"),
      content: T("S247"),
      button1: { cb: powerOffNow, text: T("S248") },
      button2: { text: T("S28") },
    })
  }

  // Opcional: si en HMI querés también cortar sesión como en navbar global
  const disconnectNow = () => {
    const formData = new FormData()
    formData.append("DISCONNECT", "YES")
    createNewRequest(
      espHttpURL("login"),
      { method: "POST", id: "login", body: formData },
      {
        onSuccess: () => webSocketService.disconnect("sessiontimeout"),
        onFail: () => webSocketService.disconnect("sessiontimeout"),
      }
    )
  }

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
        <span class="navbar-section hmi-header-left">

          {/* Grupo 1: Icono + Texto */}
          <span class="hmi-title-group">
            <span class="feather-icon-container">
              <Monitor />
            </span>

            <strong class="text-ellipsis">
              {T("HMI")}
            </strong>
          </span>

          {/* Grupo 2: Controles */}
          <span class="hmi-header-status">
            <span
              className={`btn btn-link no-box feather-icon-container ${!isIdle ? "disabled opacity-50" : ""
                }`}
              onClick={isIdle ? onPowerOff : undefined}
            >
              <Power />
            </span>

            <span
              className="btn btn-link no-box feather-icon-container"
              onClick={reloadPage}
            >
              <RotateCw />
            </span>

            <div
              class={`cnc-status-led ${effectiveState
                ? `state-${String(effectiveState).toLowerCase()}`
                : "state-offline"
                }`}
            />
          </span>
        </span>

        {/* Derecha */}
        <span class="navbar-section">
          {isFullScreen && (
            <div
              class="hmi-exit-switch active"
              onClick={exitFullscreen}
              title="Exit HMI"
            >
              <div class="switch-track">
                <div class="switch-thumb" />
              </div>

              <span class="switch-monitor-icon">
                <  Monitor size={20} />
              </span>
            </div>
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

                {activeSection === "terminal" && (
                  <div class="hmi-embedded-panel">
                    <TerminalPanel embedded />
                  </div>
                )}

                {activeSection === "outputs" && (
                  <div class="hmi-embedded-panel">
                    <SpindlePanel embedded />
                  </div>
                )}

                {activeSection === "probe" && (
                  <div class="hmi-embedded-panel">
                    <ProbePanel embedded />
                  </div>
                )}



                {!["files", "jog", "overrides", "terminal", "outputs", "probe"].includes(activeSection)
                  && (
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

                <Button
                  class={`hmi-nav-btn ${activeSection === "jog" ? "is-active" : ""}`}
                  onClick={() => setActiveSection("jog")}
                >
                  {iconsTarget.Joystick}
                  <span>{T("S66")}</span>
                </Button>

                <Button
                  class={`hmi-nav-btn ${activeSection === "files" ? "is-active" : ""}`}
                  onClick={() => setActiveSection("files")}
                >
                  {iconsTarget.SDCard}
                  <span>{T("S65")}</span>
                </Button>

                <Button
                  class={`hmi-nav-btn ${activeSection === "overrides" ? "is-active" : ""}`}
                  onClick={() => setActiveSection("overrides")}
                >
                  {iconsTarget.Mixer}
                  <span>{T("CN65")}</span>
                </Button>

                <Button
                  class={
                    "hmi-nav-btn hmi-nav-btn-reset" +
                    (isLatched ? " is-locked" : "") +
                    (resetBusy ? " is-busy" : "")
                  }
                  aria-pressed={isLatched}
                  onClick={(e: TargetedMouseEvent<HTMLButtonElement>) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onResetPress()
                  }}
                >
                  <Octagon size={18} />
                  <span>{T("CN23")}</span>
                </Button>

                <Button
                  class={`hmi-nav-btn ${activeSection === "outputs" ? "is-active" : ""}`}
                  onClick={() => setActiveSection("outputs")}
                >
                  {iconsTarget.Outputs}
                  <span>{T("CN36")}</span>
                </Button>

                <Button
                  class={`hmi-nav-btn ${activeSection === "terminal" ? "is-active" : ""}`}
                  onClick={() => setActiveSection("terminal")}
                >
                  <Terminal size={18} />
                  <span>{T("S75")}</span>
                </Button>

                <Button
                  class={`hmi-nav-btn ${activeSection === "probe" ? "is-active" : ""}`}
                  onClick={() => setActiveSection("probe")}
                >
                  {iconsTarget.Diamond}
                  <span>{T("CN37")}</span>
                </Button>
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
