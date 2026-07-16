/*
 useToolPositionTracking.ts - keeps the toolhead marker in sync with the
 controller's live position, preferring WPos over MPos (positions.wx/wy/wz
 are usually strings, same as in JogCNC).
*/
import { useEffect } from "preact/hooks"
import type { Positions } from "../../../targets/types"

interface ToolPosition {
    x: number
    y: number
    z: number
}

export function useToolPositionTracking(
    positions: Positions,
    setToolPos: (pos: ToolPosition | null) => void
): void {
    useEffect(() => {
        if (!positions) return

        // 1) Preferimos WPos si existe
        const rawX = positions.wx ?? positions.x
        const rawY = positions.wy ?? positions.y
        const rawZ = positions.wz ?? positions.z

        const x = typeof rawX === "number" ? rawX : parseFloat(String(rawX))
        const y = typeof rawY === "number" ? rawY : parseFloat(String(rawY))
        const z = typeof rawZ === "number" ? rawZ : parseFloat(String(rawZ))

        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return

        setToolPos({ x, y, z })
        // setToolPos is a useState setter (stable across renders); omitted so this
        // effect only re-runs on an actual positions update.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [positions])
}
