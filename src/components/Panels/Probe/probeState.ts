/*
 probeState.ts - the probe panel's field values are module-level singletons
 (not component state) so that ProbePanel's dashboard instance and any future
 embedded instance (e.g. inside Hmi.tsx) always agree on the current probe
 settings, and so a value entered in one keeps its edit across remounts.
*/
import type { JSX, TargetedMouseEvent } from "preact"
import type { DependItem } from "../../Helpers"

export type NumberValue = { current: number; valid?: boolean }
export type StringValue = { current: string; valid?: boolean }

export const maxprobe = {} as Partial<NumberValue>
export const probefeedrate = {} as Partial<NumberValue>
export const probethickness = {} as Partial<NumberValue>
export const proberetract = {} as Partial<NumberValue>
export const probetype = {} as Partial<StringValue>
export const probeaxis = {} as Partial<StringValue>

export interface ProbeFieldOption {
    label: string
    value: string
    depend?: DependItem[]
}

// The dynamic controls rendered in the probe panel body: number/select inputs
// routed to ProbeControlField/<Field>, plus "m2" spacers and "button" entries
// rendered directly below. Not a discriminated union - `type` is a plain
// string (same reasoning as Field.tsx's own FieldProps) - so fields irrelevant
// to a given `type` are simply left undefined.
export interface ProbeElementConfig {
    id: string
    type: string
    label?: string
    tooltip?: string
    append?: string
    options?: ProbeFieldOption[]
    min?: number
    max?: number
    step?: number
    value?: { current?: string | number; valid?: boolean }
    variableName?: string
    icon?: JSX.Element
    iconRight?: boolean
    mode?: string
    useinput?: boolean
    onclick?: (e: TargetedMouseEvent<HTMLButtonElement>) => void
}

// ProbeControlField only ever receives the number/select variant - the "m2"
// and "button" cases are rendered inline before reaching it - so `value` is
// guaranteed present there (though `.current` itself starts out undefined
// until the panel's mount effect populates it from useUiContextFn.getValue()).
export interface ProbeFieldElement extends ProbeElementConfig {
    value: { current?: string | number; valid?: boolean }
}

export interface ProbeControlGroup {
    label: string
    id: string
    controls: {
        id: string
        elements: ProbeElementConfig[]
    }[]
}
