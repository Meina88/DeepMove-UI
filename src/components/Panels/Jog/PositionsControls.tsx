/*
 PositionsControls.tsx - ESP3D WebUI component file

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
import { Fragment } from "preact"
import { useUiContextFn } from "../../../contexts"
import { T } from "../../Translations"
import { Button } from "../../Controls"
import { useTargetContext } from "../../../targets"

//A separate control to avoid the full panel to be updated when the positions are updated
interface PositionsControlsProps {
    mode: "mpos" | "wpos"
    onWPosClick: (letter: string, position: string) => void
    onHomeAxis: (axis: string) => void
    onZeroAxis: (axis: string) => void
    onConfirmHomeAxis: (axis: string) => void
}

const PositionsControls = ({
    mode,
    onWPosClick,
    onHomeAxis: _onHomeAxis,
    onZeroAxis,
    onConfirmHomeAxis,
}: PositionsControlsProps) => {
    const { positions } = useTargetContext()   // ✅ acá adentro
    const isMPos = mode === "mpos"
    const isWPos = mode === "wpos"

    return (
        <Fragment>
            {["x", "y", "z"].map((letter) => {
                const hasM = typeof positions[letter] !== "undefined"
                const hasW = typeof positions[`w${letter}`] !== "undefined"

                if (isMPos && !hasM) return null
                if (isWPos && !hasW) return null
                if (!useUiContextFn.getValue(`show${letter}`)) return null

                const axis = letter.toUpperCase()

                return (
                    <div key={letter} class="jog-positions-ctrls m-1">

                        {/* ===== MPos ===== */}
                        {isMPos && (
                            <div class="jog-position-row">
                                <div class="jog-position-ctrl">

                                    <Button
                                        class="jog-position-sub-header jog-axis-clickable"
                                        onClick={() => onConfirmHomeAxis(axis)}
                                        title={T("CN10")}
                                    >
                                        {axis}
                                        <sub class="jog-axis-sub">M</sub>
                                    </Button>

                                    <div class="jog-position-value">
                                        {positions[letter]}
                                    </div>

                                </div>
                            </div>
                        )}

                        {/* ===== WPos ===== */}
                        {isWPos && (
                            <div class="jog-position-row">
                                <div class="jog-position-ctrl">

                                    <Button
                                        class="jog-position-sub-header jog-axis-clickable"
                                        onClick={() => onZeroAxis(axis)}
                                        title={T("CN19")}
                                    >
                                        {axis}
                                        <sub class="jog-axis-sub jog-axis-sub-w">W</sub>
                                    </Button>

                                    <div
                                        class="jog-position-value jog-position-clickable"
                                        onClick={() => {
                                            useUiContextFn.click()
                                            onWPosClick(letter, String(positions[`w${letter}`]))
                                        }}
                                    >
                                        {positions[`w${letter}`]}
                                    </div>

                                </div>
                            </div>
                        )}

                    </div>
                )
            })}
        </Fragment>
    )

}

export { PositionsControls }
export type { PositionsControlsProps }
