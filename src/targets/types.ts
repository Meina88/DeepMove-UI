/*
 types.ts - TypeScript type definitions for Target contexts

 Copyright (c) 2025 Mike Melancon. All rights reserved.

 This code is free software; you can redistribute it and/or
 modify it under the terms of the GNU Lesser General Public
 License as published by the Free Software Foundation; either
 version 2.1 of the License, or (at your option) any later version.

 This code is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 Lesser General Public License for more details.

 You should have received a copy of the GNU Lesser General Public
 License along with This code; if not, write to the Free Software
 Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

// Type definitions for Target Context - the real, verified public surface of
// TargetContext.tsx, consolidated from the 20 consumers that used to each
// declare their own ad-hoc `as any` / `as unknown as {...}` shape for it.

// undefined included because filters.ts's getStatus() only fills in axes
// present in the current MPos/WPos report - every consumer already guards
// with `typeof positions[x] !== "undefined"` or a falsy check.
export interface Positions {
    [axis: string]: string | number | undefined
}

export interface Status {
    state?: string
    // A raw regex-captured status code (e.g. "Hold:0" -> code="0"), always a
    // string in filters.ts's getStatus() - only ever templated/passed to T(),
    // never compared numerically, so no need for the `number` this was
    // previously (incorrectly) typed as.
    code?: string
    power?: { value: number }
    [key: string]: any
}

export interface StreamStatus {
    status?: string
    name?: string
    type?: string
    processed?: number
    total?: number
    code?: number
}

// A "states" entry (feed_rate, spindle_speed, active_tool, ...) is either a
// single {value, pre?} or an array of them (active_tool can report several).
// value is a number for feed_rate/active_tool/spindle_speed (parsed with
// parseFloat in filters.ts's getStates()) and a string for gcode-mode entries
// (e.g. "G54") - both current consumers already do Number(entry.value).
export interface StateEntry {
    value: string | number
    pre?: string
}
export type StatesMap = Record<string, StateEntry | StateEntry[]>

export type PinsStates = Record<string, boolean>

export interface GcodeParameterEntry {
    data: string[]
    success?: boolean
}
export type GcodeParameters = Record<string, GcodeParameterEntry>

export interface TargetContextValue {
    positions: Positions
    status: Status
    states: StatesMap
    pinsStates: PinsStates
    message?: string
    alarmCode: number
    errorCode: number
    streamStatus: StreamStatus
    overrides: Record<string, any>
    gcodeParameters: GcodeParameters
    grblVersion: Record<string, any>
    grblSettings: Record<string, any>
    processData: (type: string, data: string, noecho?: boolean) => void
}

// useTargetContextFn is the module-level singleton (not a React context)
// used to reach TargetContext's processData/isStaId without needing a
// mounted provider - see contexts/HttpQueueContext.tsx and hooks/useSettings.ts.
// processData is optional because it's only assigned once TargetContextProvider
// renders for the first time; isStaId is assigned unconditionally at module load.
export interface TargetContextFn {
    // fieldData: unknown - the one implementation (TargetContext.tsx) never reads it
    isStaId: (subsectionId: string, label: string, fieldData: unknown) => boolean
    processData?: (type: string, data: string, noecho?: boolean) => void
}
