// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { renderHook } from "@testing-library/preact"
import { useExclusiveFullscreenPanels } from "./useExclusiveFullscreenPanels"

const panelsList = [
    { id: "hmiPanel" },
    { id: "jogPanel" },
    { id: "toolpathPanel" },
    { id: "filesPanel" },
]

describe("useExclusiveFullscreenPanels", () => {
    it("does nothing while not fullscreen", () => {
        const setPanelsVisibles = vi.fn()
        renderHook(() =>
            useExclusiveFullscreenPanels({
                selfId: "hmiPanel",
                isFullScreen: false,
                panelsList,
                panelsVisibles: [panelsList[1], panelsList[2]],
                setPanelsVisibles,
            })
        )

        expect(setPanelsVisibles).not.toHaveBeenCalled()
    })

    it("hides every other panel and keeps only itself once fullscreen", () => {
        const setPanelsVisibles = vi.fn()
        const visiblesBefore = [panelsList[1], panelsList[2], panelsList[3]]

        const { rerender } = renderHook(
            ({ isFullScreen }) =>
                useExclusiveFullscreenPanels({
                    selfId: "hmiPanel",
                    isFullScreen,
                    panelsList,
                    panelsVisibles: visiblesBefore,
                    setPanelsVisibles,
                }),
            { initialProps: { isFullScreen: false } }
        )

        rerender({ isFullScreen: true })

        expect(setPanelsVisibles).toHaveBeenCalledWith([panelsList[0]])
    })

    it("restores the previously visible panels when exiting fullscreen", () => {
        const setPanelsVisibles = vi.fn()
        const visiblesBefore = [panelsList[1], panelsList[2]]

        const { rerender } = renderHook(
            ({ isFullScreen }) =>
                useExclusiveFullscreenPanels({
                    selfId: "hmiPanel",
                    isFullScreen,
                    panelsList,
                    panelsVisibles: visiblesBefore,
                    setPanelsVisibles,
                }),
            { initialProps: { isFullScreen: false } }
        )

        rerender({ isFullScreen: true })
        setPanelsVisibles.mockClear()

        rerender({ isFullScreen: false })

        expect(setPanelsVisibles).toHaveBeenCalledWith(visiblesBefore)
    })

    it("restores the previously visible panels on unmount while still fullscreen", () => {
        const setPanelsVisibles = vi.fn()
        const visiblesBefore = [panelsList[3]]

        const { rerender, unmount } = renderHook(
            ({ isFullScreen }) =>
                useExclusiveFullscreenPanels({
                    selfId: "hmiPanel",
                    isFullScreen,
                    panelsList,
                    panelsVisibles: visiblesBefore,
                    setPanelsVisibles,
                }),
            { initialProps: { isFullScreen: false } }
        )

        rerender({ isFullScreen: true })
        setPanelsVisibles.mockClear()

        unmount()

        expect(setPanelsVisibles).toHaveBeenCalledWith(visiblesBefore)
    })

    it("falls back to hiding everything if the self panel is missing from the list", () => {
        const setPanelsVisibles = vi.fn()

        const { rerender } = renderHook(
            ({ isFullScreen }) =>
                useExclusiveFullscreenPanels({
                    selfId: "doesNotExist",
                    isFullScreen,
                    panelsList,
                    panelsVisibles: [panelsList[1]],
                    setPanelsVisibles,
                }),
            { initialProps: { isFullScreen: false } }
        )

        rerender({ isFullScreen: true })

        expect(setPanelsVisibles).toHaveBeenCalledWith([])
    })
})
