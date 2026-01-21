import { Point3D } from "../types/toolpath.types"

export function topView(p: Point3D) {
    return {
        x: p.x,
        y: -p.y,
    }
}




export function obliqueView(p: Point3D) {
    return {
        x: p.x - p.y,
        y: -p.z - (p.x + p.y) * 0.5,
    }
}

