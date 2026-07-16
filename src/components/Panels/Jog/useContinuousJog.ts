/*
 useContinuousJog.ts - press-and-hold continuous jog engine used by JogPanel:
 a short tap sends a single step move, holding past CONTINUOUS_JOG_DELAY
 switches to a continuous $J move that is cancelled with a realtime jog-cancel
 byte on release.

 Copyright (c) 2021 Luc LEBOSSE. All rights reserved.

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
import { useRef, useEffect } from "preact/hooks"
import { useUiContextFn } from "../../../contexts"

export const jogStepsXYZ = [100, 10, 1, 0.1] as const

const CONTINUOUS_JOG_DELAY = 200
const CONTINUOUS_DISTANCE = 5000

export interface ContinuousJogHandlers {
    onPointerDown: () => void
    onPointerUp: () => void
    onPointerLeave: () => void
    onPointerCancel: () => void
}

interface UseContinuousJogParams {
    jogStepIndex: number
    setJogStepIndex: (index: number) => void
    // currentFeedRate/currentAxis-dependent feedrate lookup, injected so this
    // hook has no knowledge of that (module-level, shared-across-instances) state.
    getFeedrateForStep: (axis: string, step: number) => number
    // Resolves the "Axis+"/"Axis-" selector placeholder to the currently
    // selected axis letter; injected for the same reason as getFeedrateForStep.
    resolveAxis: (axis: string) => string
    sendGcode: (cmd: string) => void
}

interface UseContinuousJogResult {
    jogPressHandlers: (axis: string) => ContinuousJogHandlers
    startJog: (axis: string) => void
    stopJog: (axis: string) => void
    cancelJog: () => void
    forceCancelJog: () => void
    sendJogCommand: (axis: string, stepIndexOverride?: number) => void
}

export function useContinuousJog({
    jogStepIndex,
    setJogStepIndex,
    getFeedrateForStep,
    resolveAxis,
    sendGcode,
}: UseContinuousJogParams): UseContinuousJogResult {
    const jogStepRef = useRef(jogStepIndex)
    const jogTimerRef = useRef<number | null>(null)
    const continuousRef = useRef(false)
    const effectiveStepRef = useRef<number>(0)

    useEffect(() => {
        jogStepRef.current = jogStepIndex
    }, [jogStepIndex])

    const cancelJog = () => {
        // Jog Cancel es un comando realtime (un byte), NO gcode
        sendGcode("\x85")
    }

    const forceCancelJog = () => {
        if (jogTimerRef.current !== null) {
            clearTimeout(jogTimerRef.current)
            jogTimerRef.current = null
        }

        if (continuousRef.current) {
            cancelJog()
            continuousRef.current = false
        }

        document.body.style.overflow = ""
    }

    const sendJogCommand = (axis: string, stepIndexOverride?: number) => {
        const effectiveIndex =
            stepIndexOverride !== undefined
                ? stepIndexOverride
                : jogStepIndex

        const distance = jogStepsXYZ[effectiveIndex]
        const feedrate = getFeedrateForStep(axis, distance)
        const selectedAxis = resolveAxis(axis)

        const cmd = `$J=G91 G21 ${selectedAxis}${distance} F${feedrate}`
        sendGcode(cmd)
    }

    const jogPressHandlers = (axis: string): ContinuousJogHandlers => ({
        onPointerDown: () => {
            useUiContextFn.haptic()
            document.body.style.overflow = "hidden"

            // capturamos el step efectivo EN EL DOWN
            let effectiveStepIndex = jogStepRef.current

            if (axis === "Z+" || axis === "Z-") {
                const currentStep = jogStepsXYZ[jogStepRef.current]

                if (currentStep === 100) {
                    // Z safe → 100 → 10
                    effectiveStepIndex = 1
                    setJogStepIndex(1)
                }
            }

            effectiveStepRef.current = effectiveStepIndex
            continuousRef.current = false

            // armamos el timer en REF (cancelable al instante)
            jogTimerRef.current = window.setTimeout(() => {
                continuousRef.current = true

                const feed = getFeedrateForStep(axis, jogStepsXYZ[effectiveStepRef.current])
                const cmd = `$J=G91 G21 ${axis}${CONTINUOUS_DISTANCE} F${feed}`
                sendGcode(cmd)
            }, CONTINUOUS_JOG_DELAY)
        },

        onPointerUp: () => {
            // cancelá SIEMPRE el timer por ref
            if (jogTimerRef.current !== null) {
                clearTimeout(jogTimerRef.current)
                jogTimerRef.current = null
            }

            if (continuousRef.current) {
                forceCancelJog()
            } else {
                // tap corto -> step exacto capturado
                sendJogCommand(axis, effectiveStepRef.current)
                document.body.style.overflow = ""
            }
        },

        onPointerLeave: forceCancelJog,
        onPointerCancel: forceCancelJog,
    })

    const startJog = (axis: string) => {
        jogPressHandlers(axis).onPointerDown()
    }

    const stopJog = (axis: string) => {
        jogPressHandlers(axis).onPointerUp()
    }

    return { jogPressHandlers, startJog, stopJog, cancelJog, forceCancelJog, sendJogCommand }
}
