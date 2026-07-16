/*
 useLaserTest.ts - the "Laser Test Fire" button: pulses the laser at the
 current power slider setting for a user-adjustable duration, then turns it
 back off and re-homes feed mode.
*/
import { useState } from "preact/hooks"
import { useTargetCommands } from "../../../hooks"
import { spindleSpeedValue } from "./spindleState"

export function useLaserTest(
    laserMaxPower: number,
    targetCommands: ReturnType<typeof useTargetCommands>["targetCommands"]
): {
    laserTestDuration: number
    setLaserTestDuration: (duration: number) => void
    fireLaserTest: () => void
} {
    const [laserTestDuration, setLaserTestDuration] = useState(0.5)

    const getLaserPowerValue = () => {
        const percent = spindleSpeedValue.current ?? 0
        return Math.round((percent / 100) * laserMaxPower)
    }

    const fireLaserTest = () => {
        const power = getLaserPowerValue()
        const duration = laserTestDuration

        targetCommands(`M3 S${power}`)
        targetCommands("G1 F1000")
        targetCommands(`G4 P${duration}`)
        targetCommands("M5 S0")
        targetCommands("G0")
    }

    return { laserTestDuration, setLaserTestDuration, fireLaserTest }
}
