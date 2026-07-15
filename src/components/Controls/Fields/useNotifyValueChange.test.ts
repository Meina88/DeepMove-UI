// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest"
import { renderHook } from "@testing-library/preact"
import { useNotifyValueChange } from "./useNotifyValueChange"

describe("useNotifyValueChange", () => {
    it("calls setValue(null, true) once on mount", () => {
        const setValue = vi.fn()
        renderHook(() => useNotifyValueChange(setValue, "a"))
        expect(setValue).toHaveBeenCalledWith(null, true)
        expect(setValue).toHaveBeenCalledTimes(1)
    })

    it("calls setValue again only when dep actually changes", () => {
        const setValue = vi.fn()
        const { rerender } = renderHook(
            ({ dep }: { dep: string }) => useNotifyValueChange(setValue, dep),
            { initialProps: { dep: "a" } }
        )
        expect(setValue).toHaveBeenCalledTimes(1)

        rerender({ dep: "a" })
        expect(setValue).toHaveBeenCalledTimes(1)

        rerender({ dep: "b" })
        expect(setValue).toHaveBeenCalledTimes(2)
    })

    it("does nothing when setValue is undefined", () => {
        expect(() => renderHook(() => useNotifyValueChange(undefined, "a"))).not.toThrow()
    })

    it("works with non-scalar deps (e.g. an array reference, as used by ItemsList)", () => {
        const setValue = vi.fn()
        const list = [{ id: "a" }]
        const { rerender } = renderHook(
            ({ dep }: { dep: typeof list }) => useNotifyValueChange(setValue, dep),
            { initialProps: { dep: list } }
        )
        expect(setValue).toHaveBeenCalledTimes(1)

        rerender({ dep: [...list] }) // new array reference
        expect(setValue).toHaveBeenCalledTimes(2)
    })
})
