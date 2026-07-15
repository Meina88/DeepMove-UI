import { useEffect } from "preact/hooks"
import { useSettingsContext } from "../../../contexts"
import { generateDependIds, checkDependencies } from "../../Helpers"
import type { DependencyCondition } from "../../../types/dependencies.types"

/**
 * Toggles the display of the #id and #group-{id} DOM nodes based on `depend`
 * conditions evaluated against the current interface/connection settings.
 * Boolean, Slider, Input, Mask and ItemsList used to each reimplement this
 * effect verbatim; this hook is the single copy.
 *
 * Not used by Select.tsx: its dependency-visibility effect also folds in
 * each option's own `depend` into the re-run trigger, which this hook does
 * not model.
 */
export function useFieldVisibility(id: string, depend?: DependencyCondition[]): void {
    const { interfaceSettings, connectionSettings } = useSettingsContext()
    const dependIds = generateDependIds(depend, interfaceSettings.current.settings)

    useEffect(() => {
        const visible = checkDependencies(depend, interfaceSettings.current.settings, connectionSettings.current)
        if (document.getElementById(id))
            document.getElementById(id)!.style.display = visible
                ? "block"
                : "none"
        if (document.getElementById(`group-${id}`))
            document.getElementById(`group-${id}`)!.style.display = visible
                ? "block"
                : "none"
        // dependIds already flattens `depend` into the primitive values that matter (generateDependIds);
        // interfaceSettings/connectionSettings are stable refs. Adding `depend` itself would defeat the
        // purpose of dependIds since callers often pass a fresh array literal on every render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...dependIds])
}
