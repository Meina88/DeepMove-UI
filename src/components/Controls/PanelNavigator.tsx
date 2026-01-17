import { FunctionalComponent } from "preact"
import { useEffect, useRef, useState } from "preact/hooks"
import { useUiContext, useUiContextFn } from "../../contexts"
import { useTargetCommands } from "../../hooks"
import { useTargetContext } from "../../targets"
import { iconsFeather } from "../Images"
import { iconsTarget } from "../../targets"
import { T } from "../Translations"
import { Octagon } from "preact-feather"


const iconsList: Record<string, any> = {
  ...iconsTarget,
  ...iconsFeather,
}

const TOTAL_SLOTS = 5
const RESET_INDEX = 2
const SOFT_RESET = "\x18"
const UNLOCK = "$X"

const PanelNavigator: FunctionalComponent = () => {
  const { panels } = useUiContext()
  const uiFn = useUiContextFn
  const { targetCommands } = useTargetCommands()
  const { status } = useTargetContext() as any

  const machineState: string = status?.state ?? "Idle"

  // ✅ ESTE es el estado real del botón (solo por acción del usuario)
  const [isLatched, setIsLatched] = useState(false)

  const goToPanel = (id?: string) => {
    if (!id) return
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }

  // ✅ Si la máquina vuelve a Idle, soltamos visualmente el botón (seguro)
  useEffect(() => {
    if (machineState === "Idle" && isLatched) {
      setIsLatched(false)
    }
  }, [machineState, isLatched])

  useEffect(() => {
    if (machineState === "Alarm" && !isLatched) {
      setIsLatched(true)
    }
  }, [machineState, isLatched])


  const onResetPress = () => {
    useUiContextFn.haptic([50, 80, 50, 80, 50])

    // Siempre enviamos soft reset
    targetCommands(SOFT_RESET)

    // 🔴 Si estamos en Alarm, desbloqueamos inmediatamente
    if (machineState === "Alarm") {
      targetCommands(UNLOCK)
      return
    }

    // 🟡 Si no estamos Idle (Hold, Run, etc), solo latcheamos visual
    if (machineState !== "Idle" && !isLatched) {
      setIsLatched(true)
    }
  }



  // Panels visibles EXCLUYENDO reset (4 botones)
  const panelButtons = panels.visibles.slice(0, TOTAL_SLOTS - 1)

  const slots = Array.from({ length: TOTAL_SLOTS }, (_, index) => {
    if (index === RESET_INDEX) return { type: "reset" as const }
    const panelIndex = index < RESET_INDEX ? index : index - 1
    return { type: "panel" as const, panel: panelButtons[panelIndex] ?? null }
  })

  return (
    <div class="panel-navigator">
      {slots.map((slot, i) => {
        if (slot.type === "reset") {
          return (
            <button
              key={`reset-${i}`}
              class={
                "panel-navigator-btn panel-navigator-btn-reset" +
                (isLatched ? " is-locked" : "")
              }
              aria-pressed={isLatched}
              title={T("Soft Reset")}
              onMouseDown={onResetPress}
              onTouchStart={onResetPress}
            >
              <Octagon />
            </button>

          )
        }

        if (!slot.panel) {
          return (
            <button
              key={`empty-${i}`}
              class="panel-navigator-btn panel-navigator-btn-empty"
              aria-hidden="true"
            />
          )
        }

        const panel = slot.panel
        const panelId = panel.id as string
        const panelName = panel.name as string
        const iconKey = panel.icon as string

        return (
          <button
            key={panelId}
            class="panel-navigator-btn"
            onClick={() => {
              uiFn.haptic()
              goToPanel(panelId)
            }}
            title={T(panelName)}
          >
            {iconsList[iconKey] ?? iconKey}
          </button>
        )
      })}
    </div>
  )
}

export default PanelNavigator
