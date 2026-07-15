import { describe, expect, it } from "vitest"
import {
    addObjectItem,
    BitsArray,
    limitArr,
    removeEntriesByIDs,
    removeObjectItem,
    splitArrayByLines,
} from "./arrays"

// mergeJSON was removed in Paso 4 (preferences.json collapse) - its only
// real consumer, src/targets/index.ts, now imports a single, hand-merged
// preferences.json instead of assembling one from 3 layers at runtime. See
// src/targets/defaultPreferences.snapshot.test.ts for the gate that proved
// the collapsed file produces the same tree the old merge did.

describe("limitArr", () => {
    it("keeps the array untouched when under the limit", () => {
        expect(limitArr([1, 2, 3], 5)).toEqual([1, 2, 3])
    })

    it("keeps only the last N items when over the limit", () => {
        expect(limitArr([1, 2, 3, 4, 5], 2)).toEqual([4, 5])
    })
})

describe("removeEntriesByIDs", () => {
    it("filters out entries whose id is in the removal list", () => {
        const src = [{ id: "a" }, { id: "b" }, { id: "c" }]
        expect(removeEntriesByIDs(src, ["b"])).toEqual([{ id: "a" }, { id: "c" }])
    })
})

describe("splitArrayByLines", () => {
    it("splits a byte buffer into lines on \\n and \\r", () => {
        const bytes = new Uint8Array([65, 66, 10, 67]) // "AB\nC"
        expect(splitArrayByLines(bytes.buffer)).toEqual([
            [65, 66],
            [67],
        ])
    })
})

describe("addObjectItem / removeObjectItem", () => {
    it("adds a new entry when no matching key exists", () => {
        const src: { id: string; value: number }[] = [{ id: "a", value: 1 }]
        addObjectItem(src, "id", { id: "b", value: 2 })
        expect(src).toEqual([
            { id: "a", value: 1 },
            { id: "b", value: 2 },
        ])
    })

    it("replaces an existing entry with a matching key", () => {
        const src = [{ id: "a", value: 1 }]
        addObjectItem(src, "id", { id: "a", value: 99 })
        expect(src).toEqual([{ id: "a", value: 99 }])
    })

    it("removes the entry whose key matches the given value", () => {
        const src = [{ id: "a" }, { id: "b" }]
        removeObjectItem(src, "id", "a")
        expect(src).toEqual([{ id: "b" }])
    })
})

describe("BitsArray", () => {
    it("round-trips an integer through fromInt/toInt", () => {
        const bits = Object.create(BitsArray).fromInt(5, 8) // 0b00000101
        expect(bits.getBit(0)).toBe(1)
        expect(bits.getBit(1)).toBe(0)
        expect(bits.getBit(2)).toBe(1)
        expect(bits.toInt()).toBe(5)
    })

    it("builds from a mixed array of 0/1, \"0\"/\"1\" and falsy values", () => {
        const bits = Object.create(BitsArray).fromArray([1, "0", "1", 0, undefined])
        expect(bits.bits).toEqual(["1", "0", "1", "0", "0"])
    })

    it("setBit toggles a single bit and toInt reflects it", () => {
        const bits = Object.create(BitsArray).fromInt(0, 4)
        bits.setBit(1, 1)
        expect(bits.toInt()).toBe(0b0010)
    })
})
