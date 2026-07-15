import { describe, expect, it } from "vitest"
import { extractLines } from "./LineBuffer"

describe("extractLines", () => {
    it("returns no lines and buffers the tail when there is no newline yet", () => {
        expect(extractLines("", "partial")).toEqual({ lines: [], remainder: "partial" })
    })

    it("extracts a single complete line and clears the remainder", () => {
        expect(extractLines("", "ok\n")).toEqual({ lines: ["ok"], remainder: "" })
    })

    it("extracts multiple complete lines from one chunk", () => {
        expect(extractLines("", "line1\nline2\nline3\n")).toEqual({
            lines: ["line1", "line2", "line3"],
            remainder: "",
        })
    })

    it("carries over an incomplete tail to be completed by the next call", () => {
        const first = extractLines("", "line1\npart")
        expect(first).toEqual({ lines: ["line1"], remainder: "part" })

        const second = extractLines(first.remainder, "ial\n")
        expect(second).toEqual({ lines: ["partial"], remainder: "" })
    })

    it("strips \\r from incoming data before splitting", () => {
        expect(extractLines("", "line1\r\nline2\r\n")).toEqual({
            lines: ["line1", "line2"],
            remainder: "",
        })
    })

    it("prepends the existing buffer before scanning for newlines", () => {
        expect(extractLines("prefix-", "suffix\n")).toEqual({
            lines: ["prefix-suffix"],
            remainder: "",
        })
    })
})
