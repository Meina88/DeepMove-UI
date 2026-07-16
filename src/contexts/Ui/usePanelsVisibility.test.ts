// @vitest-environment jsdom
import { describe, it, expect } from "vitest"
import { renderHook, act } from "@testing-library/preact"
import { usePanelsVisibility } from "./usePanelsVisibility"

describe("usePanelsVisibility", () => {
    it("starts with no panels visible", () => {
        const { result } = renderHook(() => usePanelsVisibility())
        expect(result.current.visibles).toEqual([])
        expect(result.current.isVisible("jog")).toBe(false)
    })

    it("show() adds the matching panel from list to the front of visibles", () => {
        const { result } = renderHook(() => usePanelsVisibility())
        act(() => {
            result.current.set([{ id: "jog" }, { id: "files" }])
        })
        act(() => {
            result.current.show("jog", false)
        })
        expect(result.current.isVisible("jog")).toBe(true)
        expect(result.current.visibles.map((p) => p.id)).toEqual(["jog"])
    })

    it("hide() removes a panel from visibles", () => {
        const { result } = renderHook(() => usePanelsVisibility())
        act(() => {
            result.current.set([{ id: "jog" }])
        })
        act(() => {
            result.current.show("jog", false)
        })
        act(() => {
            result.current.hide("jog")
        })
        expect(result.current.isVisible("jog")).toBe(false)
    })

    it("setVisibles() replaces the whole visible list", () => {
        const { result } = renderHook(() => usePanelsVisibility())
        act(() => {
            result.current.setVisibles([{ id: "a" }, { id: "b" }])
        })
        expect(result.current.visibles.map((p) => p.id)).toEqual(["a", "b"])
    })

    it("show() with fixed=true orders visibles per setPanelsOrder", () => {
        const { result } = renderHook(() => usePanelsVisibility())
        act(() => {
            result.current.set([
                { id: "jog", settingid: "jogsetting" },
                { id: "files", settingid: "filessetting" },
            ])
            result.current.setPanelsOrder([
                { index: 0, id: "filessetting" },
                { index: 1, id: "jogsetting" },
            ])
        })
        act(() => {
            result.current.show("jog", true)
        })
        act(() => {
            result.current.show("files", true)
        })
        expect(result.current.visibles.map((p) => p.id)).toEqual(["files", "jog"])
    })

    it("bumps updateTrigger every time visibility changes", () => {
        const { result } = renderHook(() => usePanelsVisibility())
        const initial = result.current.updateTrigger
        act(() => {
            result.current.setVisibles([{ id: "a" }])
        })
        expect(result.current.updateTrigger).toBe(initial + 1)
    })
})
