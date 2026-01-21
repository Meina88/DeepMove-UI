export type Point3D = {
    x: number
    y: number
    z: number
}

export type SegmentType = "rapid" | "feed"

export type Segment = {
    start: Point3D
    end: Point3D
    type: SegmentType
}

export type BoundingBoxData = {
    minX: number
    minY: number
    minZ: number
    maxX: number
    maxY: number
    maxZ: number
}

export type ViewPreset = {
    id: string
    name: string
    projection: (p: Point3D) => { x: number; y: number }
    showAxes: boolean
    showBounds: boolean
}
