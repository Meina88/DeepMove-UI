import { describe, expect, it } from "vitest"
import {
    addObjectItem,
    BitsArray,
    limitArr,
    mergeJSON,
    removeEntriesByIDs,
    removeObjectItem,
    splitArrayByLines,
} from "./arrays"

// Characterization tests: pin the CURRENT behavior of mergeJSON before it is
// removed/replaced in Paso 4 (preferences.json collapse). Some of this
// behavior (e.g. in-place mutation of o1) is a pre-existing quirk, not a
// specification of desired behavior.
describe("mergeJSON", () => {
    it("adds keys present in o2 but missing in o1 (plain object merge)", () => {
        const o1 = { a: 1 }
        const result = mergeJSON<any>(o1, { b: 2 })
        expect(result).toEqual({ a: 1, b: 2 })
    })

    it("recurses into nested plain objects", () => {
        const o1 = { general: { theme: "dark" } }
        const result = mergeJSON<any>(o1, { general: { language: "es" } })
        expect(result).toEqual({ general: { theme: "dark", language: "es" } })
    })

    it("mutates o1 in place and returns the same reference", () => {
        const o1 = { a: 1 }
        const result = mergeJSON<any>(o1, { b: 2 })
        expect(result).toBe(o1)
    })

    it("appends array items from o2 whose id is not already present in o1", () => {
        const o1 = [{ id: "x", value: 1 }]
        const result = mergeJSON(o1, [{ id: "y", value: 2 }])
        expect(result).toEqual([
            { id: "x", value: 1 },
            { id: "y", value: 2 },
        ])
    })

    it("overwrites the scalar `value` of a matching-id item instead of duplicating it", () => {
        const o1 = [{ id: "x", value: 1 }]
        const result = mergeJSON(o1, [{ id: "x", value: 99 }])
        expect(result).toEqual([{ id: "x", value: 99 }])
    })

    it("carries over `hide` onto a matching-id item when o2 specifies it", () => {
        const o1 = [{ id: "x", value: 1 }]
        const result = mergeJSON<any>(o1, [{ id: "x", value: 1, hide: true }])
        expect(result).toEqual([{ id: "x", value: 1, hide: true }])
    })

    it("id-merges nested array `value`s of a matching-id item instead of replacing wholesale", () => {
        const o1 = [
            {
                id: "toolpath",
                value: [{ id: "showtoolpathpanel", value: true }],
            },
        ]
        const o2 = [
            {
                id: "toolpath",
                value: [
                    { id: "showtoolpathpanel", value: false },
                    { id: "toolpathMaxSegmentsDesktop", value: 5000 },
                ],
            },
        ]
        const result = mergeJSON<any>(o1, o2)
        expect(result).toEqual([
            {
                id: "toolpath",
                value: [
                    { id: "showtoolpathpanel", value: false },
                    { id: "toolpathMaxSegmentsDesktop", value: 5000 },
                ],
            },
        ])
    })

    it("leaves an item alone when its JSON representation is already identical", () => {
        const o1 = [{ id: "x", value: 1 }]
        const result = mergeJSON(o1, [{ id: "x", value: 1 }])
        expect(result).toEqual([{ id: "x", value: 1 }])
    })
})

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
