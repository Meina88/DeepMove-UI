import { describe, expect, it } from "vitest"
import { canShowMainView } from "./viewState"

describe("canShowMainView", () => {
    it("shows the main view once connected and the UI settings are ready", () => {
        expect(canShowMainView({ connected: true, page: "/" }, true)).toBe(true)
    })

    it("does not show it when the link is up but the settings are still loading", () => {
        // The WebSocket connects before preferences.json has been fetched
        expect(canShowMainView({ connected: true, page: "/" }, false)).toBe(false)
    })

    it("does not show it while disconnected, even if the settings had loaded earlier", () => {
        expect(canShowMainView({ connected: false, page: "connectionlost" }, true)).toBe(false)
    })

    it("does not show it while the board is updating/restarting", () => {
        expect(canShowMainView({ connected: true, page: "/", updating: true }, true)).toBe(false)
    })
})
