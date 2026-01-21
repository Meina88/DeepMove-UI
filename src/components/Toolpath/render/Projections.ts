import { Point3D } from "../types/toolpath.types"

export function topView(p: Point3D) {
    return { x: p.x, y: -p.y }
}

export function obliqueView(p: Point3D) {
    const angle = Math.PI / 6
    return {
        x: p.x + p.y * Math.cos(angle),
        y: -p.z + p.y * Math.sin(angle),
    }
}
