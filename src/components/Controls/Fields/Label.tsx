/*
 Label.tsx - ESP3D WebUI component file

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

import { FunctionalComponent } from "preact"
import { useNotifyValueChange } from "./useNotifyValueChange"

export interface LabelCtrlProps {
    label?: string
    id?: string
    value?: string
    setValue?: (val: any, update?: boolean) => void
    [key: string]: any
}

// Notified once on mount/import - value never actually changes afterwards
// since a label isn't an input, but the effect still keys off `value` for
// consistency with the other Fields/*.tsx components.
const LabelCtrl: FunctionalComponent<LabelCtrlProps> = ({ label: _label = "", id: _id = "", value = "", setValue }) => {
    useNotifyValueChange(setValue, value)
    return null
}

export default LabelCtrl
