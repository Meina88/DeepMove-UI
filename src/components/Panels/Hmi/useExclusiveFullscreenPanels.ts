/*
 useExclusiveFullscreenPanels.ts - makes a fullscreen panel exclusive: while
 it's fullscreen, every other dashboard panel is hidden (unmounted), and the
 previous visibility set is restored once it's no longer fullscreen.

 Without this, a panel that renders its own "embedded" instance of other
 panels internally (as Hmi.tsx does for Jog/Files/Toolpath/...) ends up with
 two live instances of those panels at once: the dashboard's own, still
 mounted underneath the fullscreen overlay, and HMI's embedded one on top.
*/
import { useRef, useEffect } from "preact/hooks"
import type { Panel } from "../../../contexts"

interface UseExclusiveFullscreenPanelsParams {
    selfId: string
    isFullScreen: boolean
    panelsList: Panel[]
    panelsVisibles: Panel[]
    setPanelsVisibles: (panels: Panel[]) => void
}

export function useExclusiveFullscreenPanels({
    selfId,
    isFullScreen,
    panelsList,
    panelsVisibles,
    setPanelsVisibles,
}: UseExclusiveFullscreenPanelsParams): void {
    const savedVisiblesRef = useRef<Panel[] | null>(null)

    useEffect(() => {
        if (!isFullScreen) return

        savedVisiblesRef.current = panelsVisibles
        const selfPanel = panelsList.find((p) => p.id === selfId)
        setPanelsVisibles(selfPanel ? [selfPanel] : [])

        // Runs both when isFullScreen flips back to false and if this
        // component unmounts while still fullscreen - either way, restore
        // whatever was visible before.
        return () => {
            if (savedVisiblesRef.current) {
                setPanelsVisibles(savedVisiblesRef.current)
                savedVisiblesRef.current = null
            }
        }
        // panelsList/panelsVisibles/setPanelsVisibles come from UiContext, a
        // fresh object every render; only isFullScreen should trigger this
        // save/hide/restore cycle.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isFullScreen])
}
