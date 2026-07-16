/*
 spindleState.ts - shared spindle-panel types and the spindle-speed module-
 level singleton (mirrors probeState.ts's reasoning: shared across every
 SpindlePanel instance, dashboard or embedded, so an edit in one is reflected
 in the other rather than each keeping its own copy).
*/
import type { JSX } from "preact"
import type { DependItem } from "../../Helpers"

export type NumberValue = { current: number }
export const spindleSpeedValue = {} as Partial<NumberValue>

// Machine-state gate on top of checkDependencies' setting/connection conditions
// (e.g. `{ states: ["Hold"] }` to only show a button while the machine is held).
// checkDependencies ignores entries with none of id/connection_id/orGroups (treats
// them as always-true), so this file additionally filters on `states` itself.
export interface StatesDependItem {
    states: string[]
}
export type ButtonDependItem = DependItem | StatesDependItem
export const isStatesDependItem = (item: ButtonDependItem): item is StatesDependItem => "states" in item

export type ButtonCfg = {
    label?: string
    tooltip?: string
    tooltipclassic?: boolean
    command: string
    icon?: JSX.Element
    iconRight?: boolean
    useinput?: boolean
    mode?: string
    depend?: ButtonDependItem[]
}
export type ButtonsGroup = {
    label: string
    buttons: ButtonCfg[]
    control?: { id: string; type: string; label: string; value: Partial<NumberValue>; min?: number }
    depend?: ButtonDependItem[]
    tooltipclassic?: boolean
}
