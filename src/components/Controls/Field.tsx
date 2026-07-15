/*
Field.tsx - ESP3D WebUI component file

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

import { Fragment,  FunctionalComponent } from "preact"
import {
    FormGroup,
    Input,
    Select,
    Boolean,
    PickUp,
    ItemsList,
    IconSelect,
    LabelCtrl,
    Slider,
    Mask,
} from "./Fields"
import type { BooleanProps } from "./Fields/Boolean"
import type { SelectProps } from "./Fields/Select"
import type { SliderProps } from "./Fields/Slider"
import type { InputProps } from "./Fields/Input"
import type { MaskProps } from "./Fields/Mask"
import type { ItemsListProps } from "./Fields/ItemsList"
import type { PickUpProps } from "./Fields/PickUp"
import type { IconSelectProps } from "./Fields/IconSelect"
import type { LabelCtrlProps } from "./Fields/Label"

// Field.tsx is a runtime dispatcher keyed by `type`: each switch case renders
// a different Fields/*.tsx component, each with its own prop shape. FieldProps
// is the union of all of them; every branch below narrows `props` to the one
// specific shape it actually renders. This isn't a true discriminated union
// (the "default"/Input branch matches any `type` string not handled above, so
// TypeScript can't exhaustively discriminate on it) - each cast is a plain
// narrowing to a known member of the union, not an escape to `any`.
export type FieldProps =
    | BooleanProps
    | SelectProps
    | SliderProps
    | InputProps
    | MaskProps
    | ItemsListProps
    | PickUpProps
    | IconSelectProps
    | LabelCtrlProps

const Field: FunctionalComponent<FieldProps> = (props) => {
    const { type } = props
    switch (type) {
        case "mask":
        case "xmask":
            return (
                <div>
                    <Mask {...props as MaskProps} />
                    <FormGroup {...props}></FormGroup>
                </div>
            )
        case "label":
            return (
                <FormGroup {...props}>
                    <LabelCtrl {...props as LabelCtrlProps} />
                </FormGroup>
            )
        case "list":
            return (
                <Fragment>
                    <ItemsList {...props as ItemsListProps} />
                    <FormGroup {...props} />
                </Fragment>
            )
        case "pickup":
            return (
                <FormGroup {...props}>
                    <PickUp {...props as PickUpProps} />
                </FormGroup>
            )
        case "icon":
            return (
                <FormGroup {...props}>
                    <IconSelect {...props as IconSelectProps} />
                </FormGroup>
            )
        case "select":
            return (
                <FormGroup {...props}>
                    <Select {...props as SelectProps} />
                </FormGroup>
            )
        case "slider":
            return (
                <FormGroup {...props}>
                    <Slider {...props as SliderProps} />
                </FormGroup>
            )
        case "boolean":
            return (
                <FormGroup {...props}>
                    <Boolean {...props as BooleanProps} />
                </FormGroup>
            )
        default:
            //input
            return (
                <FormGroup {...props}>
                    <Input {...props as InputProps} />
                </FormGroup>
            )
    }
}
export { Field }
