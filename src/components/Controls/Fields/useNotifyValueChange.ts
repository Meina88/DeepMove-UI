import { useEffect } from "preact/hooks"

/**
 * Calls setValue(null, true) whenever `dep` changes - the "notify the parent
 * so it re-validates/re-registers this field" effect duplicated across
 * nearly every Fields/*.tsx component. `dep` is usually the field's `value`,
 * but ItemsList's ItemControl keys it off `completeList` instead.
 *
 * setValue is provided fresh (non-memoized) by the caller on every render,
 * so this must fire only when `dep` itself changes, not on every re-render.
 */
export function useNotifyValueChange<T>(
    setValue: ((value: null, update: true) => void) | undefined,
    dep: T
): void {
    useEffect(() => {
        if (setValue) setValue(null, true)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dep])
}
