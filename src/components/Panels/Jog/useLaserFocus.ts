/*
 useLaserFocus.ts - laser focus-power toggle used by JogPanel when the active
 tool is the laser.

 Copyright (c) 2021 Luc LEBOSSE. All rights reserved.

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
import { useState, useEffect } from "preact/hooks"
import { useUiContextFn } from "../../../contexts"

interface UseLaserFocusParams {
    isLaserMode: boolean
    isIdle: boolean
    sendGcode: (cmd: string) => void
}

interface UseLaserFocusResult {
    laserFocus: boolean
    // Returns whether the toggle actually ran (false when !isIdle), so the
    // caller can decide whether to blur the triggering button, matching the
    // original inline handler's early-return-before-blur behavior.
    toggleLaserFocus: () => boolean
}

export function useLaserFocus({ isLaserMode, isIdle, sendGcode }: UseLaserFocusParams): UseLaserFocusResult {
    const [laserFocus, setLaserFocus] = useState(false)

    useEffect(() => {
        if (!isLaserMode && laserFocus) {
            setLaserFocus(false)
        }
    }, [isLaserMode, laserFocus])

    const toggleLaserFocus = (): boolean => {
        if (!isIdle) return false

        useUiContextFn.haptic()

        const next = !laserFocus
        setLaserFocus(next)

        const focusPercent = Number(useUiContextFn.getValue("laserfocuspower") ?? 5)
        const maxS = Number(useUiContextFn.getValue("laser_max_power") ?? 1000)
        const focusS = Math.round(maxS * focusPercent / 100)

        if (next) {
            sendGcode(`M3 S${focusS}`)
            sendGcode("G1 F1000")
        } else {
            sendGcode("M5 S0")
            sendGcode("G0")
        }

        return true
    }

    return { laserFocus, toggleLaserFocus }
}
