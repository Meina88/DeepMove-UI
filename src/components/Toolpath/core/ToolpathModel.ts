import { BoundingBox } from "./BoundingBox"
import { Segment } from "../types/toolpath.types"

export class ToolpathModel {
    segments: Segment[] = []
    bbox = new BoundingBox()

    clear() {
        this.segments = []
        this.bbox.reset()
    }

    addSegment(segment: Segment) {
        this.segments.push(segment)
        this.bbox.expand(segment.start)
        this.bbox.expand(segment.end)
    }
}
