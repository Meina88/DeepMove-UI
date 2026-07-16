/*
 ProbeControlField.tsx - renders one dynamic number/select field from the
 probe panel's config (see probeControlsConfig.tsx) through the generic
 <Field> control, with the same inline validation every probe field needs:
 clamp an out-of-range select back to its first valid option, reject a
 number not aligned to its configured step, and reject an out-of-range or
 empty number.
*/
import type { FunctionalComponent } from "preact"
import { useState } from "preact/hooks"
import { T } from "../../Translations"
import type { SettingsContextValue } from "../../../contexts"
import { variablesList } from "../../../targets"
import { Field } from "../../Controls"
import { checkDependencies } from "../../Helpers"
import type { ProbeFieldElement, ProbeFieldOption } from "./probeState"

interface ProbeControlFieldProps {
    element: ProbeFieldElement
    interfaceSettings: SettingsContextValue["interfaceSettings"]
    connectionSettings: SettingsContextValue["connectionSettings"]
}

const ProbeControlField: FunctionalComponent<ProbeControlFieldProps> = ({
    element,
    interfaceSettings,
    connectionSettings,
}) => {
    //we won't handle modified state just handle error
    //too many user cases where changing value to show button is not suitable
    const [validation, setvalidation] = useState({
        message: null,
        valid: true,
        modified: false,
    })

    const filterOptions = (options: ProbeFieldOption[] | undefined): ProbeFieldOption[] => {
        if (options)
            return options.filter((option) => {
                return checkDependencies(
                    option.depend,
                    interfaceSettings.current.settings,
                    connectionSettings.current
                )
            })
        return options ?? []
    }

    const generateValidation = (element: ProbeFieldElement) => {
        let validation = {
            message: null,
            valid: true,
            modified: false,
        }
        if (
            element.type === "select" &&
            -1 ==
                filterOptions(element.options).findIndex(
                    (item) => item.value == element.value.current
                )
        ) {
            element.value.current = filterOptions(element.options)[0].value
        }
        if (typeof element.step !== "undefined") {
            //hack to avoid float precision issue
            const inv = 1 / element.step
            const mult = inv > 0 ? Number(inv.toFixed(0)) : 1
            const valueMult = Math.round(Number(element.value.current) * mult)
            const stepMult = Math.round(element.step * mult)
            if (valueMult % stepMult != 0) {
                validation.valid = false
            }
        }
        if (
            element.type === "number" &&
            (Number(element.value.current) < Number(element.min) ||
                (typeof element.value.current === "string" && element.value.current.length === 0))
        ) {
            //No error message to keep all control aligned
            //may be have a better way ?
            // validation.message = T("S42");
            validation.valid = false
        }

        element.value.valid = validation.valid
        return validation
    }
    return (
        <Field
            key={element.id}
            inline
            id={element.id}
            type={element.type}
            label={T(element.label ?? "")}
            append={element.append}
            options={filterOptions(element.options)}
            min={element.min}
            max={element.max}
            step={element.step}
            value={element.value.current}
            setValue={(val: string | number | null, update = false) => {
                if (!update && val !== null) {
                    element.value.current = val
                }
                const validationObj = generateValidation(element)
                setvalidation(validationObj)
                if (validationObj.valid && element.variableName) {
                    variablesList.addCommand({
                        name: element.variableName,
                        // Always defined by the time a variableName field validates: ProbePanel's
                        // mount effect seeds every value.current before any Field can call setValue.
                        value: element.value.current!,
                    })
                }
            }}
            validation={validation}
        />
    )
}

export { ProbeControlField }
