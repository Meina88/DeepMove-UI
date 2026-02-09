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
  const prevMachineState = useRef<string>(machineState)


  const normalizedState = String(machineState).toLowerCase()
  const isAlarm = normalizedState.startsWith("alarm")
  const isIdle = normalizedState === "idle"



  // ✅ ESTE es el estado real del botón (solo por acción del usuario)
  const [isLatched, setIsLatched] = useState(false)
  // ⏳ Evita doble click / spam de reset (PC principalmente)
const [resetBusy, setResetBusy] = useState(false)
const [activePanelId, setActivePanelId] = useState<string | null>(null)


  const goToPanel = (id?: string) => {
    if (!id) return
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }

  useEffect(() => {
    const prev = String(prevMachineState.current).toLowerCase()
    const prevAlarm = prev.startsWith("alarm")

    // 🔴 Entrada en Alarm (automática)
    if (isAlarm && !prevAlarm) {
      setIsLatched(true)
    }

    // 🟢 Salida real de Alarm → Idle
    if (prevAlarm && isIdle) {
      setIsLatched(false)
    }

    prevMachineState.current = machineState
  }, [machineState, isAlarm, isIdle])


useEffect(() => {
  if (!panels?.visibles?.length) return

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActivePanelId(entry.target.id)
        }
      })
    },
    {
      root: null,        // viewport
      threshold: 0.6,    // 60% visible = activo
    }
  )

  panels.visibles.forEach((panel: any) => {
    const el = document.getElementById(panel.id)
    if (el) observer.observe(el)
  })

  return () => observer.disconnect()
}, [panels.visibles])


  const onResetPress = () => {
  // 🚫 Ignorar clicks repetidos durante la ventana crítica
  if (resetBusy) return

  setResetBusy(true)
  window.setTimeout(() => {
    setResetBusy(false)
  }, 350)
    useUiContextFn.haptic([50, 80, 50, 80, 50])

    // Normalizá por si viene "ALARM", "Alarm:..." etc.
    const state = String(machineState).toLowerCase()
    const isAlarm = state.startsWith("alarm")

    if (isAlarm) {
      // Para hard limit alarms suele ser necesario:
      // 1) Soft reset (Ctrl+X)
      // 2) Unlock ($X)
      targetCommands(SOFT_RESET)

      // Pequeño delay para que el firmware procese el reset
      window.setTimeout(() => {
        targetCommands(UNLOCK)
      }, 120)

      return
    }

    // Cualquier otro estado → Soft Reset
    targetCommands(SOFT_RESET)
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
  (isLatched ? " is-locked" : "") +
  (resetBusy ? " is-busy" : "")
}

              aria-pressed={isLatched}
              title={T("Soft Reset")}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onResetPress()
              }}

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
  class={
    "panel-navigator-btn" +
    (activePanelId === panelId ? " is-active" : "")
  }
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
