/*
preferences.types.ts - Shared types for the interface-settings tree

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

import type { DependencyCondition } from "./dependencies.types"

/**
 * A single option of a "select" field.
 */
export interface PreferencesSelectOption {
    label: string
    value: string | number
    depend?: DependencyCondition[]
    [key: string]: any
}

/**
 * A node in the interface-settings tree (what preferences.json's
 * `settings.<section>.<subsection>` arrays are made of). This is the same
 * recursive shape used to be redeclared independently in
 * tabs/interface/index.tsx (FieldData), exportHelper.ts (SettingsSubItem /
 * SettingValue) and Controls/Fields/ItemsList.tsx (FieldItem / ItemData).
 *
 * `value`/`initial` stay as `any` deliberately: their real shape depends on
 * `type` (boolean -> boolean, number -> number, group/list -> nested
 * PreferencesFieldData[], ...), and the JSON they come from is not validated
 * against a schema at runtime - narrowing them further would just move the
 * `any` one level down without adding real safety.
 */
export interface PreferencesFieldData {
    id: string
    type?: string
    label?: string
    name?: string
    value: any
    initial?: any
    depend?: DependencyCondition[]
    options?: PreferencesSelectOption[]
    shortkey?: boolean
    // step is stored as a JSON string in preferences.json (e.g. "0.001") for at
    // least the probe section, same as min/max below; arithmetic use sites (e.g.
    // ProbeCNC.tsx's `1 / element.step`) rely on JS's implicit string->number
    // coercion, which is why this stays a union rather than just `number`.
    step?: number | string
    min?: number | string
    max?: number | string
    minSecondary?: number
    minsecondary?: number
    regexpattern?: string
    nb?: number
    haserror?: boolean
    hasmodified?: boolean
    newItem?: boolean
    editionMode?: boolean
    hide?: boolean
    fixed?: boolean
    sorted?: boolean
    nodelete?: boolean
    editable?: boolean
    append?: string
    help?: string
    [key: string]: any
}

/**
 * The shape of interfaceSettings.current.settings: sectionId -> array of
 * field nodes (e.g. settings.jog -> [{id:"showjogpanel",...}, {id:"axis",...}]).
 * Code that walks it with Object.keys()/for..in and indexes back in by that
 * key still works, since Object.keys() on an array yields its numeric
 * indices as strings.
 */
export interface PreferencesSection {
    [sectionId: string]: PreferencesFieldData[]
}
