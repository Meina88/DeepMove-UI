/*
 useToolpathViewPrefs.ts - view-preset selection and grid-visibility
 preference, persisted to localStorage, for the toolpath viewer.
*/
import { useState, useEffect, useMemo } from "preact/hooks"
import { VIEW_PRESETS } from "../../Toolpath/render/ViewPresets"

export type ViewId = "top" | "oblique" | "front" | "side"

const DEFAULT_VIEWS: ViewId[] = ["top", "oblique"]

export interface UseToolpathViewPrefsResult {
    viewIndex: number
    setViewIndex: (updater: number | ((prev: number) => number)) => void
    showGrid: boolean
    setShowGrid: (updater: boolean | ((prev: boolean) => boolean)) => void
    enabledViews: ViewId[]
    setEnabledViews: (updater: ViewId[] | ((prev: ViewId[]) => ViewId[])) => void
    visiblePresets: typeof VIEW_PRESETS
}

export function useToolpathViewPrefs(): UseToolpathViewPrefsResult {
    const [viewIndex, setViewIndex] = useState(0)

    const [showGrid, setShowGrid] = useState<boolean>(() => {
        const v = localStorage.getItem("toolpath.showGrid")
        return v === null ? true : v === "true"
    })

    useEffect(() => {
        localStorage.setItem("toolpath.showGrid", String(showGrid))
    }, [showGrid])

    const [enabledViews, setEnabledViews] = useState<ViewId[]>(() => {
        const raw = localStorage.getItem("toolpath.enabledViews")
        if (!raw) return DEFAULT_VIEWS

        try {
            return JSON.parse(raw)
        } catch {
            return DEFAULT_VIEWS
        }
    })

    useEffect(() => {
        localStorage.setItem(
            "toolpath.enabledViews",
            JSON.stringify(enabledViews)
        )
    }, [enabledViews])

    const visiblePresets = useMemo(
        () => VIEW_PRESETS.filter(v => enabledViews.includes(v.id as ViewId)),
        [enabledViews]
    )

    useEffect(() => {
        if (viewIndex >= visiblePresets.length) {
            setViewIndex(0)
        }
    }, [viewIndex, visiblePresets])

    return {
        viewIndex,
        setViewIndex,
        showGrid,
        setShowGrid,
        enabledViews,
        setEnabledViews,
        visiblePresets,
    }
}
