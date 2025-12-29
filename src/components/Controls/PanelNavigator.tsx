import { FunctionalComponent } from "preact"
import { useUiContext } from "../../contexts"
import { iconsFeather } from "../Images"
import { iconsTarget } from "../../targets"
import { T } from "../Translations"

const iconsList: Record<string, any> = {
  ...iconsTarget,
  ...iconsFeather,
}

const PanelNavigator: FunctionalComponent = () => {
  const { panels } = useUiContext()

  const goToPanel = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  return (
    <div class="panel-navigator">
      {panels.visibles.map((panel: any) => (
        <button
          key={panel.id}
          class="panel-navigator-btn"
          onClick={() => goToPanel(panel.id)}
          title={T(panel.name)}
        >
          {/* 🔥 ICONO DIRECTO, NO COMO COMPONENTE */}
          {iconsList[panel.icon] ?? panel.icon}
        </button>
      ))}
    </div>
  )
}

export default PanelNavigator
