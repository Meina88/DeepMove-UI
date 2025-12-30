import { FunctionalComponent } from "preact"
import { useUiContext, useUiContextFn } from "../../contexts"
import { iconsFeather } from "../Images"
import { iconsTarget } from "../../targets"
import { T } from "../Translations"
import { RefreshCcw } from "preact-feather"
import { useTargetCommands } from "../../hooks"


const iconsList: Record<string, any> = {
  ...iconsTarget,
  ...iconsFeather,
}

const TOTAL_SLOTS = 7
const RESET_INDEX = 3 // centro exacto

const PanelNavigator: FunctionalComponent = () => {
  const { panels } = useUiContext()
  const { targetCommands } = useTargetCommands()


  const goToPanel = (id?: string) => {
    if (!id) return
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

const doReset = () => {
  useUiContextFn.haptic()
  targetCommands("\x18") // Ctrl+X → Soft Reset FluidNC
}


  // Panels visibles EXCLUYENDO reset
  const panelButtons = panels.visibles.slice(0, TOTAL_SLOTS - 1)

  // Construimos los 7 slots fijos
  const slots = Array.from({ length: TOTAL_SLOTS }, (_, index) => {
    if (index === RESET_INDEX) {
      return {
        type: "reset",
      }
    }

    const panelIndex =
      index < RESET_INDEX ? index : index - 1

    return {
      type: "panel",
      panel: panelButtons[panelIndex] ?? null,
    }
  })

  return (
    <div class="panel-navigator">
      {slots.map((slot, i) => {
        // 🔴 RESET
        if (slot.type === "reset") {
          return (
            <button
              key={`reset-${i}`}
              class="panel-navigator-btn panel-navigator-btn-reset"
              onClick={doReset}
              title={T("Reset")}
            >
              <RefreshCcw />
            </button>
          )
        }

        // ⚪ Slot vacío (mantiene layout)
        if (!slot.panel) {
          return (
            <button
              key={`empty-${i}`}
              class="panel-navigator-btn panel-navigator-btn-empty"
              aria-hidden="true"
            />
          )
        }

        // 🔵 Panel normal
        // 🔵 Panel normal (tipado seguro)
const panel = slot.panel
const panelId = panel.id as string
const panelName = panel.name as string
const iconKey = panel.icon as string

return (
  <button
    key={panelId}
    class="panel-navigator-btn"
    onClick={() => goToPanel(panelId)}
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
