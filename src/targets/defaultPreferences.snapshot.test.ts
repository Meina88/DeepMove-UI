import { describe, expect, it } from "vitest"
import defaultPreferences from "./CNC/FluidNC/preferences.json"

// Paso 4 collapsed the 3-layer mergeJSON(base, target, subTarget) computation
// into this single, hand-authored preferences.json (generated
// programmatically from the old layers, not retyped by hand, to avoid
// transcription mistakes). This test compares it against the snapshot
// written in Paso 2 while the old merge was still in place - a diff here
// means the collapse changed the effective preferences tree and must be
// investigated before being accepted.
//
// This still deliberately imports the JSON file directly rather than
// "./index" (the targets barrel): that barrel unconditionally imports
// "./CNC/FluidNC", which transitively pulls in UI panel components that
// touch `window` at module scope and require a DOM environment Vitest
// doesn't have configured yet (see Paso 5).
// The describe/it names below are kept identical to the ones used in Paso 2
// on purpose: Vitest keys stored snapshots by the full test name path, so
// renaming them would make this test write a brand new snapshot instead of
// diffing against the one captured before the collapse - defeating the gate.
describe("defaultPreferences (pre-collapse snapshot)", () => {
    it("merges base -> CNC -> FluidNC preferences.json layers", () => {
        expect(defaultPreferences).toMatchSnapshot()
    })

    it("resolves the 5 known overlapping sections with non-empty content", () => {
        const settings = defaultPreferences.settings as Record<string, unknown[]>

        for (const section of ["toolpath", "panels", "polling", "files", "jog"]) {
            expect(Array.isArray(settings[section]), `expected settings.${section} to be an array`).toBe(true)
            expect(
                settings[section].length,
                `expected settings.${section} to be non-empty`
            ).toBeGreaterThan(0)
        }
    })
})
