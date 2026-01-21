import { Point3D } from "../types/toolpath.types"

export class GCodeState {
    position: Point3D = { x: 0, y: 0, z: 0 }
    absoluteMode = true
    inchMode = false

    reset() {
        this.position = { x: 0, y: 0, z: 0 }
        this.absoluteMode = true
        this.inchMode = false
    }

    moveTo(target: Partial<Point3D>): Point3D {
        const factor = this.inchMode ? 25.4 : 1

        const next: Point3D = {
            x: target.x !== undefined
                ? (this.absoluteMode ? target.x * factor : this.position.x + target.x * factor)
                : this.position.x,
            y: target.y !== undefined
                ? (this.absoluteMode ? target.y * factor : this.position.y + target.y * factor)
                : this.position.y,
            z: target.z !== undefined
                ? (this.absoluteMode ? target.z * factor : this.position.z + target.z * factor)
                : this.position.z,
        }

        return next
    }
}
