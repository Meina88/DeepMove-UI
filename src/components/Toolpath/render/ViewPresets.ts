import { ViewPreset } from "../types/toolpath.types"
import { topView, obliqueView, frontView, sideView } from "./Projections"

export const VIEW_PRESETS: ViewPreset[] = [
    {
        id: "top",
        name: "Top",
        projection: topView,
        showAxes: true,
        showBounds: false,
    },
    {
        id: "front",
        name: "Front",
        projection: frontView,
        showAxes: true,
        showBounds: true,
    },
    {
        id: "side",
        name: "Side",
        projection: sideView,
        showAxes: true,
        showBounds: true,
    },
    {
        id: "oblique",
        name: "3D",
        projection: obliqueView,
        showAxes: true,
        showBounds: true,
    },
]
