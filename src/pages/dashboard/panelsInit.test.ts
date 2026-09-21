import { describe, expect, it } from "vitest"
import { shouldInitPanels } from "./panelsInit"

describe("shouldInitPanels", () => {
    it("initializes once the panel list and the settings are both available", () => {
        expect(shouldInitPanels(false, 8, true)).toBe(true)
    })

    it("waits while the interface settings have not been loaded yet", () => {
        // Initializing now would read every show/onstart flag as undefined and latch an empty dashboard
        expect(shouldInitPanels(false, 8, false)).toBe(false)
    })

    it("waits while the panel list is still empty", () => {
        expect(shouldInitPanels(false, 0, true)).toBe(false)
    })

    it("never initializes twice", () => {
        expect(shouldInitPanels(true, 8, true)).toBe(false)
    })
})
