import { describe, expect, it } from "vitest"
import { mergeJSON } from "../components/Helpers/arrays"
import defaultPreferencesBase from "./preferences.json"
import defaultPreferencesTarget from "./CNC/preferences.json"
import defaultPreferencesSubTarget from "./CNC/FluidNC/preferences.json"

// This deliberately does NOT import "./index" (the targets barrel): that file
// unconditionally imports "./CNC/FluidNC", which transitively pulls in UI
// panel components that touch `window` at module scope (e.g.
// ExtraContent/extraContentItem.tsx's requestIdleCallback polyfill) and can
// only run under a DOM environment. Vitest is configured with
// environment: "node" until Paso 5 introduces one, so this test replicates
// exactly the computation src/targets/index.js does for `defaultPreferences`,
// without evaluating the rest of that module.
//
// This snapshot is the gate for Paso 4 (collapsing the 3-layer merge): the
// preferences.json produced after that refactor must produce a deeply equal
// tree to this one, or any difference must be explicitly justified.
// Layers differ in shape at every level (each JSON file only defines the
// sections/fields it needs), which is exactly the case mergeJSON exists for -
// its declared `Partial<T>` signature is too strict to accept that at the
// type level, so these calls opt out via an explicit `any` type argument
// rather than fighting the generic inference on a function slated for
// removal in Paso 4.
const buildDefaultPreferences = () =>
    mergeJSON<any>(
        mergeJSON<any>(defaultPreferencesBase, defaultPreferencesTarget),
        defaultPreferencesSubTarget
    )

describe("defaultPreferences (pre-collapse snapshot)", () => {
    it("merges base -> CNC -> FluidNC preferences.json layers", () => {
        expect(buildDefaultPreferences()).toMatchSnapshot()
    })

    it("resolves the 5 known overlapping sections with non-empty content", () => {
        const settings = buildDefaultPreferences().settings

        for (const section of ["toolpath", "panels", "polling", "files", "jog"]) {
            expect(Array.isArray(settings[section]), `expected settings.${section} to be an array`).toBe(true)
            expect(
                settings[section].length,
                `expected settings.${section} to be non-empty`
            ).toBeGreaterThan(0)
        }
    })
})
