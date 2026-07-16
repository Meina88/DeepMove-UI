/*
 probeControlsConfig.tsx - builds the probe panel's field/button layout: which
 axis to probe, probe type (G38.2-G38.5), max distance/feedrate/thickness/
 retract, and the "Probe" action button that sends the actual G38 command
 sequence. Kept as a single factory (rather than a static literal) only
 because the retract/thickness step values and the button's onclick both need
 live context (useUiContextFn, targetCommands) at render time.
*/
import type { TargetedMouseEvent } from "preact"
import { Diamond } from "../../../targets/CNC/FluidNC/icons"
import { useUiContextFn } from "../../../contexts"
import { useTargetCommands } from "../../../hooks"
import {
    maxprobe,
    probefeedrate,
    probethickness,
    proberetract,
    probetype,
    probeaxis,
    type ProbeControlGroup,
} from "./probeState"

export function buildProbeControls(
    targetCommands: ReturnType<typeof useTargetCommands>["targetCommands"]
): ProbeControlGroup[] {
    return [
        {
            label: "",
            id: "probe_group",
            controls: [
                {
                    id: "probe_type",
                    elements: [
                        {
                            id: "probe_axis",
                            type: "select",
                            label: "CN99",
                            tooltip: "CN98",
                            options: [
                                {
                                    label: "X",
                                    value: "X",
                                    depend: [
                                        { id: "showx", value: true },
                                        {
                                            connection_id: "Axisletters",
                                            contains: "X"
                                        }
                                    ]
                                },
                                {
                                    label: "Y",
                                    value: "Y",
                                    depend: [
                                        { id: "showy", value: true },
                                        {
                                            connection_id: "Axisletters",
                                            contains: "Y",
                                        },
                                    ]
                                },
                                {
                                    label: "Z",
                                    value: "Z",
                                    depend: [
                                        { id: "showz", value: true },
                                        {
                                            connection_id: "Axisletters",
                                            contains: "Z",
                                        },
                                    ]
                                },
                                {
                                    label: "A",
                                    value: "A",
                                    depend: [
                                        { id: "showa", value: true },
                                        {
                                            connection_id: "Axisletters",
                                            contains: "A",
                                        },
                                    ],
                                },
                                {
                                    label: "B",
                                    value: "B",
                                    depend: [
                                        { id: "showb", value: true },
                                        {
                                            connection_id: "Axisletters",
                                            contains: "B",
                                        },
                                    ],
                                },
                                {
                                    label: "C",
                                    value: "C",
                                    depend: [
                                        { id: "showc", value: true },
                                        {
                                            connection_id: "Axisletters",
                                            contains: "C",
                                        },
                                    ],
                                },
                                {
                                    label: "U",
                                    value: "U",
                                    depend: [
                                        { id: "showu", value: true },
                                        {
                                            connection_id: "Axisletters",
                                            contains: "U",
                                        },
                                    ],
                                },
                                {
                                    label: "V",
                                    value: "V",
                                    depend: [
                                        { id: "showv", value: true },
                                        {
                                            connection_id: "Axisletters",
                                            contains: "V",
                                        },
                                    ],
                                },
                                {
                                    label: "W",
                                    value: "W",
                                    depend: [
                                        { id: "showw", value: true },
                                        {
                                            connection_id: "Axisletters",
                                            contains: "W",
                                        },
                                    ],
                                },
                            ],

                            value: probeaxis,
                            variableName: "#selected_axis#",
                        },
                        {
                            id: "probe_type",
                            type: "select",
                            label: "type",
                            tooltip: "CN98",
                            options: [
                                { label: "G38.2", value: "G38.2" },
                                { label: "G38.3", value: "G38.3" },
                                { label: "G38.4", value: "G38.4" },
                                { label: "G38.5", value: "G38.5" },
                            ],
                            value: probetype,
                        },
                    ],
                },
                {
                    id: "probe_max",
                    elements: [
                        {
                            id: "probe_max_distance",
                            type: "number",
                            label: "CN93",
                            tooltip: "CN93",
                            min: 1,
                            value: maxprobe,
                            append: "CN96",
                        },
                    ],
                },

                {
                    id: "probe_feedrate",
                    elements: [
                        {
                            id: "probe_feedrate",
                            type: "number",
                            label: "CN9",
                            tooltip: "CN9",
                            append: "CN1",
                            min: 1,
                            value: probefeedrate,
                        },
                    ],
                },
                {
                    id: "probe_thickness",
                    elements: [
                        {
                            id: "probe_thickness",
                            type: "number",
                            label: "CN94",
                            tooltip: "CN94",
                            min: 0,
                            step: useUiContextFn.getElement("probethickness")
                                .step,
                            value: probethickness,
                            append: "CN96",
                            variableName: "#probe_thickness#",
                        },
                    ],
                },
                {
                    id: "probe_retract",
                    elements: [
                        {
                            id: "probe_retract",
                            type: "number",
                            label: "CN200",
                            tooltip: "CN200",
                            min: 0,
                            step: useUiContextFn.getElement("proberetract")
                                .step,
                            value: proberetract,
                            append: "CN96",
                            variableName: "#probe_retract#",
                        },
                    ],
                },
                {
                    id: "spacer",
                    elements: [
                        {
                            id: "spacer",
                            type: "m2",
                        },
                    ],
                },
                {
                    id: "probe_buttons",
                    elements: [
                        {
                            id: "probe_button",
                            icon: <Diamond />,
                            type: "button",
                            label: "CN203",
                            tooltip: "CN100",
                            onclick: (e: TargetedMouseEvent<HTMLButtonElement>) => {
                                const commands = [
                                    "G91",
                                    () => {
                                        const signe =
                                            probetype.current == "G38.2" ||
                                                probetype.current == "G38.3"
                                                ? "-"
                                                : ""
                                        return (
                                            `${probetype.current
                                            } ${probeaxis.current
                                            }${signe
                                            }${maxprobe.current
                                            } F${probefeedrate.current}`
                                        )
                                    },
                                    "G90",

                                    ...useUiContextFn
                                        .getValue("probepostcommand")
                                        .split(";"),
                                ]
                                e.currentTarget.blur()
                                useUiContextFn.haptic()
                                targetCommands(commands)
                            },
                        },
                    ],
                },
            ],
        },
    ]
}
