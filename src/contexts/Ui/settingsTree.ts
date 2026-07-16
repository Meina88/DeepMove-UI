/*
 settingsTree.ts - shared traversal for the interface-settings tree, used by
 UiContext's getValue/getElement helpers.

 Copyright (c) 2021 Alexandre Aussourd. All rights reserved.
 Modified by Luc LEBOSSE 2021

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

import type { PreferencesFieldData } from "../../types/preferences.types"

/*
 * getValue/getElement are called both with the current interfaceSettings tree
 * (shape: PreferencesSection, see types/preferences.types.ts) and with other
 * settings-like objects (e.g. connectionsettings in Helpers/components.tsx),
 * so the entry point stays untyped - only the node found while walking it is
 * typed as PreferencesFieldData.
 */
export function findSettingsNode(settingsObject: any, id: string): PreferencesFieldData | undefined {
    if (!settingsObject) return undefined
    for (let key in settingsObject) {
        const branch = settingsObject[key]
        if (Array.isArray(branch)) {
            for (let index = 0; index < branch.length; index++) {
                const node: PreferencesFieldData = branch[index]
                if (node.id == id) return node
                if (Array.isArray(node.value)) {
                    for (let subindex = 0; subindex < node.value.length; subindex++) {
                        const subnode: PreferencesFieldData = node.value[subindex]
                        if (subnode.id == id) return subnode
                    }
                }
            }
        } else {
            for (let subkey in branch) {
                const subbranch = branch[subkey]
                if (Array.isArray(subbranch)) {
                    for (let index = 0; index < subbranch.length; index++) {
                        const node: PreferencesFieldData = subbranch[index]
                        if (node.id == id) return node
                    }
                }
            }
        }
    }
    return undefined
}

export function getSettingsValue(settingsObject: any, id: string): any {
    if (!id) return undefined
    return findSettingsNode(settingsObject, id)?.value
}

export function getSettingsElement(settingsObject: any, id: string): PreferencesFieldData | undefined {
    return findSettingsNode(settingsObject, id)
}
