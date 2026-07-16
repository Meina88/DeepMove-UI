// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"

class FakeGainNode {
    gain = {
        value: 0,
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
    }
    connect = vi.fn()
}

class FakeOscillatorNode {
    type = ""
    frequency = { setValueAtTime: vi.fn() }
    connect = vi.fn()
    start = vi.fn()
    stop = vi.fn()
}

function makeFakeAudioContext(state: "running" | "suspended" = "running") {
    const resumeMock = vi.fn()
    class FakeAudioContext {
        currentTime = 0
        state = state
        destination = {}
        resume = resumeMock
        createGain() {
            return new FakeGainNode()
        }
        createOscillator() {
            return new FakeOscillatorNode()
        }
    }
    return { FakeAudioContext, resumeMock }
}

// audioEngine.ts keeps its AudioContext/GainNode in module-level singleton
// state (mirrors the original UiContext.tsx behavior), so each test resets
// modules and re-imports it fresh to avoid leaking state across cases.
describe("playTones", () => {
    beforeEach(() => {
        vi.resetModules()
    })

    it("does nothing for an undefined or empty sequence", async () => {
        // @ts-expect-error test double, not a real AudioContext
        window.AudioContext = makeFakeAudioContext().FakeAudioContext
        const { playTones } = await import("./audioEngine")
        expect(() => playTones(undefined)).not.toThrow()
        expect(() => playTones([])).not.toThrow()
    })

    it("plays a sequence of notes without throwing", async () => {
        // @ts-expect-error test double, not a real AudioContext
        window.AudioContext = makeFakeAudioContext().FakeAudioContext
        const { playTones } = await import("./audioEngine")
        expect(() =>
            playTones([
                { f: 1567, d: 100 },
                { f: 1318, d: 100 },
            ])
        ).not.toThrow()
    })

    it("resumes a suspended audio context before playing", async () => {
        const { FakeAudioContext, resumeMock } = makeFakeAudioContext("suspended")
        // @ts-expect-error test double, not a real AudioContext
        window.AudioContext = FakeAudioContext
        const { playTones } = await import("./audioEngine")
        playTones([{ f: 440 }])
        expect(resumeMock).toHaveBeenCalled()
    })

    it("does nothing when the AudioContext API is unavailable", async () => {
        // @ts-expect-error simulate an environment without Web Audio support
        window.AudioContext = undefined
        const { playTones } = await import("./audioEngine")
        expect(() => playTones([{ f: 440 }])).not.toThrow()
    })
})
