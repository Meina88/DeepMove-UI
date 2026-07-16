// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest"
import { renderHook } from "@testing-library/preact"
import { useLaserMode } from "./useLaserMode"
import { spindleSpeedValue } from "./spindleState"
import { useUiContextFn } from "../../../contexts"

beforeEach(() => {
    useUiContextFn.getValue = () => 255
})

describe("useLaserMode", () => {
    it("is not laser mode when there is no active tool", () => {
        const { result } = renderHook(() => useLaserMode({}, 2))
        expect(result.current.isLaserMode).toBe(false)
    })

    it("is not laser mode when no laser tool is configured", () => {
        const { result } = renderHook(() =>
            useLaserMode({ active_tool: { value: 2 } }, null)
        )
        expect(result.current.isLaserMode).toBe(false)
    })

    it("detects laser mode when the active tool matches the configured laser tool number", () => {
        const { result } = renderHook(() =>
            useLaserMode({ active_tool: { value: 2 } }, 2)
        )
        expect(result.current.isLaserMode).toBe(true)
    })

    it("reads the first entry when active_tool is reported as an array", () => {
        const { result } = renderHook(() =>
            useLaserMode({ active_tool: [{ value: 2 }, { value: 3 }] }, 2)
        )
        expect(result.current.isLaserMode).toBe(true)
    })

    it("does not treat a non-matching active tool as laser mode", () => {
        const { result } = renderHook(() =>
            useLaserMode({ active_tool: { value: 1 } }, 2)
        )
        expect(result.current.isLaserMode).toBe(false)
    })

    it("zeroes the shared spindle-speed value the moment laser mode engages", () => {
        spindleSpeedValue.current = 15000

        renderHook(() => useLaserMode({ active_tool: { value: 2 } }, 2))

        expect(spindleSpeedValue.current).toBe(0)
    })
})
