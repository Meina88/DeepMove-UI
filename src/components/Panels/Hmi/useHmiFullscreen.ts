/*
 useHmiFullscreen.ts - tracks whether the HMI panel's DOM node is the
 document's current fullscreen element, and wires up the two ways fullscreen
 can be entered/exited: the native Fullscreen API's own "fullscreenchange"
 event, and the "hmi:toggleFullscreen" eventBus message (e.g. from a menu
 button elsewhere in the dashboard).
*/
import { useEffect, useState } from "preact/hooks"
import { useUiContextFn } from "../../../contexts"
import { eventBus } from "../../../hooks/eventBus"

export function useHmiFullscreen(id: string): {
    isFullScreen: boolean
    exitFullscreen: () => void
} {
    const [isFullScreen, setIsFullScreen] = useState(false)

    const exitFullscreen = () => {
        useUiContextFn.haptic()

        if (document.fullscreenElement) {
            document.exitFullscreen?.()
        }
    }

    useEffect(() => {
        const handleFullScreenChange = () => {
            const element = document.getElementById(id)
            setIsFullScreen(document.fullscreenElement === element)
        }

        document.addEventListener("fullscreenchange", handleFullScreenChange)

        return () => {
            document.removeEventListener("fullscreenchange", handleFullScreenChange)
        }
    }, [id])

    useEffect(() => {
        const listenerId = eventBus.on(
            "hmi:toggleFullscreen",
            () => {
                const element = document.getElementById(id)
                if (!element) return

                if (document.fullscreenElement === element) {
                    document.exitFullscreen?.()
                } else {
                    element.requestFullscreen?.()
                }
            },
            "hmi-fullscreen-listener"
        )

        return () => {
            eventBus.off("hmi:toggleFullscreen", listenerId)
        }
    }, [id])

    return { isFullScreen, exitFullscreen }
}
