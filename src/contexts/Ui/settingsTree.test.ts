import { describe, it, expect } from "vitest"
import { findSettingsNode, getSettingsValue, getSettingsElement } from "./settingsTree"

describe("settingsTree", () => {
    const settings = {
        jog: [
            { id: "showjogpanel", value: true },
            {
                id: "axis",
                value: [
                    { id: "showx", value: false },
                    { id: "showy", value: true },
                ],
            },
        ],
        connection: {
            wifi: [{ id: "ssid", value: "MillingStation" }],
        },
    }

    it("finds a top-level array node by id", () => {
        expect(findSettingsNode(settings, "showjogpanel")).toEqual({ id: "showjogpanel", value: true })
    })

    it("finds a nested value[] node by id", () => {
        expect(findSettingsNode(settings, "showy")).toEqual({ id: "showy", value: true })
    })

    it("finds a node inside a non-array (subkey) branch", () => {
        expect(findSettingsNode(settings, "ssid")).toEqual({ id: "ssid", value: "MillingStation" })
    })

    it("returns undefined for an unknown id", () => {
        expect(findSettingsNode(settings, "doesnotexist")).toBeUndefined()
    })

    it("returns undefined for a null/undefined settings object", () => {
        expect(findSettingsNode(null, "showjogpanel")).toBeUndefined()
        expect(findSettingsNode(undefined, "showjogpanel")).toBeUndefined()
    })

    it("getSettingsValue extracts .value from the found node", () => {
        expect(getSettingsValue(settings, "showy")).toBe(true)
        expect(getSettingsValue(settings, "ssid")).toBe("MillingStation")
    })

    it("getSettingsValue returns undefined when id is falsy", () => {
        expect(getSettingsValue(settings, "")).toBeUndefined()
    })

    it("getSettingsElement returns the whole node, not just .value", () => {
        expect(getSettingsElement(settings, "showx")).toEqual({ id: "showx", value: false })
    })
})
