/*
 spindleButtonsConfig.tsx - the spindle panel's two button groups: spindle
 direction/stop + speed input (CN201), and coolant/digital-outputs (CN202).
 A factory (not a static constant) purely so JSX icon elements are created
 fresh per render, matching how the panel originally built this list inline.
*/
import { Zap, RotateCw, RotateCcw, Octagon } from "preact-feather"
import { spindleSpeedValue, type ButtonsGroup } from "./spindleState"

export function buildSpindleButtonsList(): ButtonsGroup[] {
    return [
        {
            label: "CN201",
            buttons: [
                {
                    icon: <RotateCw />,
                    // label: "M3",
                    tooltip: "CN74",
                    command: "M3 S#",
                    useinput: true,
                    mode: "spindle_mode",
                },
                {
                    icon: <Octagon />,
                    //label: "M5",
                    tooltip: "CN76",
                    command: "M5",
                    mode: "spindle_mode",
                },
                {
                    icon: <RotateCcw />,
                    //label: "M4",
                    tooltip: "CN75",
                    command: "M4 S#",
                    useinput: true,
                    mode: "spindle_mode",
                    depend: [{ id: "showM4ctrls", value: true }],
                },
            ],
            control: {
                id: "spindlespeedInput",
                type: "number",
                label: "CN59",
                value: spindleSpeedValue,
                min: 0,
            },
        },
        {
            label: "CN202",
            buttons: [
                {
                    icon: <Zap />,
                    tooltip: "CN81",
                    command: "#T-SPINDLESTOP#",
                    depend: [{ states: ["Hold"] }],
                },
                {
                    label: "M7",
                    tooltip: "CN83",
                    command: "#T-MISTCOOLANT#",
                    mode: "coolant_mode",
                },
                {
                    label: "M8",
                    tooltip: "CN82",
                    tooltipclassic: true,
                    command: "#T-FLOODCOOLANT#",
                    mode: "coolant_mode",
                },

            ],
        },
    ]
}
