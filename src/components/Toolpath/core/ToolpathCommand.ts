import type { Segment, SegmentType } from "../types/toolpath.types"

export type ToolpathCommand = {
  id: number
  motion: "G0" | "G1" | "G2" | "G3"
  type: SegmentType
  segments: Segment[]
}
