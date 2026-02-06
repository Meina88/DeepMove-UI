/*
 HMI.tsx - MillingStation HMI panel
*/

import type { FunctionalComponent } from "preact"
import { ContainerHelper, FullScreenButton, CloseButton } from "../Controls"
import { T } from "../Translations"
import { Monitor } from "preact-feather"

const HMIPanel: FunctionalComponent = () => {
    const id = "hmiPanel"

    return (
        <div class="panel panel-dashboard panel-hmi" id={id}>
            <ContainerHelper id={id} />

            {/* Header igual a otros paneles */}
            <div class="navbar">
                <span class="navbar-section feather-icon-container">
                    {/* Separación sin CSS externo */}
                    <span style={{ display: "inline-flex", marginRight: "0.35rem" }}>
                        <Monitor />
                    </span>
                    <strong class="text-ellipsis">{T("HMI")}</strong>
                </span>

                <span class="navbar-section">
                    <span class="full-height">
                        <FullScreenButton elementId={id} />
                        <CloseButton elementId={id} hideOnFullScreen={true} />
                    </span>
                </span>
            </div>

            {/* Área HMI limpia */}
            <div class="hmi-root">
                {/* vacío por ahora */}
            </div>
        </div>
    )
}

const HMIPanelElement = {
    id: "hmiPanel",
    content: <HMIPanel />,
    name: "S245",
    icon: "Monitor",
    show: "showhmipanel",
    onstart: "openhmionstart",
    settingid: "hmi",
}

export { HMIPanel, HMIPanelElement }
