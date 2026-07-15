/*
 Select.tsx - ESP3D WebUI component file

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

import { FunctionalComponent, TargetedEvent, JSX } from "preact"
import { useEffect } from "preact/hooks"
import { useSettingsContext, useUiContextFn } from "../../../contexts"
import { T } from "../../Translations"
import {
    generateDependIds,
    checkDependencies
} from "../../Helpers"
import type { DependencyCondition } from "../../../types/dependencies.types"
import { useNotifyValueChange } from "./useNotifyValueChange"

interface OptionProps {
    label: string
    value: string | number
    depend?: DependencyCondition[]
    [key: string]: any
}

interface SelectOption {
    label: string
    value: string | number
    depend?: DependencyCondition[]
}

type SelectValueCallback = (value: string | null, shouldValidate?: boolean) => void

export interface SelectProps {
    label?: string
    id?: string
    options?: SelectOption[]
    depend?: DependencyCondition[]
    inline?: boolean
    setValue?: SelectValueCallback
    value?: string | number
    help?: string
    button?: JSX.Element
    [key: string]: any
}

const Option: FunctionalComponent<OptionProps> = ({ label, depend, ...props }) => {
    const { interfaceSettings, connectionSettings } = useSettingsContext()
    if (depend) {
        const canshow = checkDependencies(
            depend,
            interfaceSettings.current.settings,
            connectionSettings.current
        )
        if (!canshow) return null
    }
    //Condition for camera - no need to display if none setup
    if (props.value == "camera") {
        if (connectionSettings.current.CameraName) {
            return (
                <option {...props}>
                    {connectionSettings.current.CameraName}
                </option>
            )
        } else return null
    }
    return <option {...props}>{T(label)}</option>
}

const Select: FunctionalComponent<SelectProps> = ({
    label: _label = "",
    id = "",
    options = [],
    depend,
    inline,
    setValue,
    value,
    help,
    button,
    ...rest
}) => {
    const props = {
        id,
        name: id,
    }
    const onChange = (e: TargetedEvent<HTMLSelectElement, Event>): void => {
        useUiContextFn.haptic()
        if (setValue) setValue(e.currentTarget.value)
    }
    const { interfaceSettings, connectionSettings } = useSettingsContext()
    const dependIds = generateDependIds(
        depend,
        interfaceSettings.current.settings
    )
    const optionList = options.map((option) => {
        return <Option key={option.label} {...option} />
    })
    options.map((option) => {
        if (option.depend) {
            const deps = generateDependIds(
                option.depend,
                interfaceSettings.current.settings
            )
            dependIds.push(...deps)
        }
    })
    // Not extracted to useFieldVisibility/useNotifyValueChange on purpose: unlike every
    // other Fields/*.tsx component, this effect also re-runs when an *option's* own
    // depend changes (dependIds above includes each option.depend), and it fires
    // setValue(null, true) from here as well as from the plain value-effect below -
    // a real divergence from the rest of the Field components, not a copy-paste
    // duplicate, so it's kept as its own effect rather than forced into the shared hooks.
    useEffect(() => {
        let visible = checkDependencies(depend, interfaceSettings.current.settings, connectionSettings.current)
        if (document.getElementById(id))
            document.getElementById(id)!.style.display = visible
                ? "block"
                : "none"
        if (document.getElementById(`group-${  id}`))
            document.getElementById(`group-${  id}`)!.style.display = visible
                ? "block"
                : "none"
        if (setValue) setValue(null, true)
        // dependIds already flattens `depend` into the primitive values that matter (generateDependIds);
        // interfaceSettings/connectionSettings are stable refs. setValue is provided fresh (non-memoized)
        // by the caller on every render, so it must not gate this effect.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...dependIds])

    useNotifyValueChange(setValue, value)

    return (
        <div class={`${inline ? "column" : ""} ${help ? "tooltip tooltip-top" : ""}`}
                data-tooltip={T(help)}>
            <select
                class={`form-select  ${inline ? "column" : ""}`}
                {...props}
                {...rest}
                value={value}
                onChange={onChange}
            >
                {optionList}
            </select>
            {button}
        </div>
    )
}
export default Select
