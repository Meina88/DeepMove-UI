// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest"
import { renderHook } from "@testing-library/preact"
import { useFieldVisibility } from "./useFieldVisibility"
import { SettingsContextProvider, useUiContextFn } from "../../../contexts"

// @testing-library/preact's bundled types declare `wrapper` as
// ComponentType<{ children: Element }>, stricter than Preact's own
// ComponentChildren that every context provider in this codebase actually
// uses - a type-definition mismatch in the library, not in our code.
const wrapper = SettingsContextProvider as any

// useUiContextFn.getElement is normally assigned by UiContextProvider once
// mounted; stub it directly here rather than mounting the full provider
// (which also wires up an audio engine) to keep this test focused on
// visibility toggling.
beforeEach(() => {
    useUiContextFn.getElement = () => undefined
})

describe("useFieldVisibility", () => {
    it("shows the #id and #group-{id} elements when depend is undefined", () => {
        document.body.innerHTML = `<div id="f1"></div><div id="group-f1"></div>`
        renderHook(() => useFieldVisibility("f1", undefined), { wrapper })

        expect(document.getElementById("f1")!.style.display).toBe("block")
        expect(document.getElementById("group-f1")!.style.display).toBe("block")
    })

    it("hides the elements when the dependency setting cannot be found", () => {
        useUiContextFn.getElement = () => undefined
        document.body.innerHTML = `<div id="f2"></div><div id="group-f2"></div>`
        renderHook(() => useFieldVisibility("f2", [{ id: "someSetting", value: true }]), { wrapper })

        expect(document.getElementById("f2")!.style.display).toBe("none")
        expect(document.getElementById("group-f2")!.style.display).toBe("none")
    })

    it("shows the elements once the dependency setting matches the expected value", () => {
        useUiContextFn.getElement = (id: string) => (id === "someSetting" ? { id, value: true } : undefined)
        document.body.innerHTML = `<div id="f3"></div>`
        renderHook(() => useFieldVisibility("f3", [{ id: "someSetting", value: true }]), { wrapper })

        expect(document.getElementById("f3")!.style.display).toBe("block")
    })

    it("does not throw when the target elements are not present in the DOM", () => {
        document.body.innerHTML = ""
        expect(() =>
            renderHook(() => useFieldVisibility("missing", undefined), { wrapper })
        ).not.toThrow()
    })
})
