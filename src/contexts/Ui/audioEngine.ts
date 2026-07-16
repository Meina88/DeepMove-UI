/*
 audioEngine.ts - low-level Web Audio tone-sequence player used by UiContext's
 beep/click/playSound helpers.

 Copyright (c) 2021 Alexandre Aussourd. All rights reserved.
 Modified by Luc LEBOSSE 2021

 This code is free software; you can redistribute it and/or
 modify it under the terms of the GNU Lesser General Public
 License as published by the Free Software Foundation; either
 version 2.1 of the License, or (at your option) any later version.
 This code is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 Lesser General Public License for more details.
 You should have received a copy of the GNU Lesser General Public
 License along with This code; if not, write to the Free Software
 Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

// Extend Window interface for vendor-prefixed AudioContext
declare global {
    interface Window {
        webkitAudioContext?: typeof AudioContext
        audioContext?: typeof AudioContext
    }
}

export interface SoundNote {
    f: number // frequency
    d?: number // duration
}

interface AudioEngineState {
    context?: AudioContext | null
    masterGain?: GainNode | null
}

const audio: AudioEngineState = {}

export function initAudio(): void {
    if (audio.context) return

    if (typeof window.AudioContext !== "undefined") {
        audio.context = new window.AudioContext()
    } else if (typeof window.webkitAudioContext !== "undefined") {
        audio.context = new window.webkitAudioContext()
    } else if (typeof window.audioContext !== "undefined") {
        audio.context = new window.audioContext()
    }

    if (audio.context) {
        audio.masterGain = audio.context.createGain()
        audio.masterGain.gain.value = 0.5 // volumen global UI
        audio.masterGain.connect(audio.context.destination)
    }
}

export function playTones(sequence?: SoundNote[]): void {
    if (!sequence || sequence.length === 0) return

    if (!audio.context) initAudio()
    if (!audio.context || !audio.masterGain) return

    if (audio.context.state === "suspended") {
        audio.context.resume()
    }

    const ctx = audio.context
    const master = audio.masterGain
    let t = ctx.currentTime + 0.001

    sequence.forEach((note) => {
        const duration = (note.d ?? 50) / 1000

        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.type = "sine" // sonido moderno limpio
        osc.frequency.setValueAtTime(note.f, t)

        // Envelope moderno
        gain.gain.setValueAtTime(0.0001, t)
        gain.gain.linearRampToValueAtTime(0.35, t + 0.003)
        gain.gain.exponentialRampToValueAtTime(0.0001, t + duration)

        osc.connect(gain)
        gain.connect(master)

        osc.start(t)
        osc.stop(t + duration + 0.01)

        t += duration
    })
}
