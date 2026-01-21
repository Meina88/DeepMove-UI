import { BoundingBoxData, Point3D } from "../types/toolpath.types"

export class BoundingBox implements BoundingBoxData {
    minX = Infinity
    minY = Infinity
    minZ = Infinity
    maxX = -Infinity
    maxY = -Infinity
    maxZ = -Infinity

    reset() {
        this.minX = this.minY = this.minZ = Infinity
        this.maxX = this.maxY = this.maxZ = -Infinity
    }

    expand(p: Point3D) {
        this.minX = Math.min(this.minX, p.x)
        this.minY = Math.min(this.minY, p.y)
        this.minZ = Math.min(this.minZ, p.z)
        this.maxX = Math.max(this.maxX, p.x)
        this.maxY = Math.max(this.maxY, p.y)
        this.maxZ = Math.max(this.maxZ, p.z)
    }
}
