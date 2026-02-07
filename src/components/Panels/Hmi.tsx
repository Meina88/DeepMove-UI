/*
 HMI.tsx - MillingStation HMI panel
*/

import type { FunctionalComponent } from "preact"
import { ContainerHelper, FullScreenButton, CloseButton } from "../Controls"
import { T } from "../Translations"
import { Upload } from "preact-feather"

const HMIPanel: FunctionalComponent = () => {
  const id = "hmiPanel"

  return (
    <div class="panel panel-dashboard panel-hmi" id={id}>
      {/* OBLIGATORIO */}
      <ContainerHelper id={id} />

<header class="navbar">

  {/* IZQUIERDA */}
  <span class="navbar-section">
    <span class="feather-icon-container">
      <Upload />
    </span>
    <strong class="text-ellipsis" style={{ marginLeft: "0.4rem" }}>
      {T("HMI")}
    </strong>
  </span>

  {/* DERECHA */}
  <span class="navbar-section">
    <span class="full-height">
      <FullScreenButton elementId={id} />      
    </span>
  </span>

</header>



      {/* CUERPO HMI */}
      <div class="panel-body panel-body-dashboard hmi-root">
        {/* contenido futuro */}
      </div>
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
