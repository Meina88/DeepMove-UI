/*
 useJogKeyboardShortcuts.ts - arrow-key/PageUp/PageDown jog shortcuts used by
 JogPanel.

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
import { useEffect } from "preact/hooks"

interface UseJogKeyboardShortcutsParams {
    enabled: boolean
    startJog: (axis: string) => void
    stopJog: (axis: string) => void
    forceCancelJog: () => void
}

export function useJogKeyboardShortcuts({
    enabled,
    startJog,
    stopJog,
    forceCancelJog,
}: UseJogKeyboardShortcutsParams): void {
    useEffect(() => {
        if (!enabled) return

        const activeKeys = new Set<string>()

        const handleKeyDown = (e: KeyboardEvent) => {
            if (activeKeys.has(e.code)) return

            switch (e.code) {
                case "ArrowRight":
                    startJog("X+")
                    activeKeys.add(e.code)
                    break
                case "ArrowLeft":
                    startJog("X-")
                    activeKeys.add(e.code)
                    break
                case "ArrowUp":
                    startJog("Y+")
                    activeKeys.add(e.code)
                    break
                case "ArrowDown":
                    startJog("Y-")
                    activeKeys.add(e.code)
                    break
                case "PageUp":
                    startJog("Z+")
                    activeKeys.add(e.code)
                    break
                case "PageDown":
                    startJog("Z-")
                    activeKeys.add(e.code)
                    break
            }
        }

        const handleKeyUp = (e: KeyboardEvent) => {
            switch (e.code) {
                case "ArrowRight":
                    stopJog("X+")
                    activeKeys.delete(e.code)
                    break
                case "ArrowLeft":
                    stopJog("X-")
                    activeKeys.delete(e.code)
                    break
                case "ArrowUp":
                    stopJog("Y+")
                    activeKeys.delete(e.code)
                    break
                case "ArrowDown":
                    stopJog("Y-")
                    activeKeys.delete(e.code)
                    break
                case "PageUp":
                    stopJog("Z+")
                    activeKeys.delete(e.code)
                    break
                case "PageDown":
                    stopJog("Z-")
                    activeKeys.delete(e.code)
                    break
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        window.addEventListener("keyup", handleKeyUp)

        const onScroll = () => {
            forceCancelJog()
        }

        window.addEventListener("scroll", onScroll, { passive: true })

        return () => {
            window.removeEventListener("keydown", handleKeyDown)
            window.removeEventListener("keyup", handleKeyUp)
            window.removeEventListener("scroll", onScroll)
            forceCancelJog()
        }

        // startJog/stopJog/forceCancelJog are plain functions recreated every render; this hook
        // re-runs on every live position update via the caller, so adding them here would tear down
        // and rebuild the keyboard listeners (and reset the activeKeys tracking) on every position
        // tick, causing missed or duplicated jog start/stop events while a key is held.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled])
}
