import { ViewPreset } from "../types/toolpath.types"
import { topView, obliqueView } from "./Projections"

export const VIEW_PRESETS: ViewPreset[] = [
    {
        id: "top",
        name: "Top",
        projection: topView,
        showAxes: true,
        showBounds: false,
    },
    {
        id: "oblique",
        name: "3D",
        projection: obliqueView,
        showAxes: true,
        showBounds: true,
    },
]
