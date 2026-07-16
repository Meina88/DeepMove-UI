/*
 useHmiActiveSection.ts - which embedded panel HMI's left zone currently
 shows. Also listens for "hmi:play" (emitted by ToolpathPanel's play button
 when it starts a run-from-file) to jump the view to the overrides section,
 so the user immediately sees the run progress/hold controls.
*/
import { useEffect, useState } from "preact/hooks"
import { eventBus } from "../../../hooks/eventBus"

export function useHmiActiveSection(): {
    activeSection: string
    setActiveSection: (section: string) => void
} {
    const [activeSection, setActiveSection] = useState<string>("files")

    useEffect(() => {
        const id = eventBus.on(
            "hmi:play",
            () => {
                setActiveSection("overrides")
            },
            "hmi-play-listener"
        )

        return () => {
            eventBus.off("hmi:play", id)
        }
    }, [])

    return { activeSection, setActiveSection }
}
