/*
 TargetContext.tsx - ESP3D WebUI context file

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
import { createContext, VNode } from "preact"
import { useRef, useContext, useState, useMemo } from "preact/hooks"
import {
    dispatchToExtensions,
    beautifyJSONString,
} from "../../../components/Helpers"
import { useDatasContext, useSettingsContextFn } from "../../../contexts"
import { processor } from "./processor"
import { isVerboseOnly } from "./stream"
import { eventsList, variablesList } from "."
import type {
    TargetContextValue,
    TargetContextFn,
    Positions,
    Status,
    StatesMap,
    PinsStates,
    GcodeParameters,
    StreamStatus,
} from "../../types"
import {
    isOk,
    isStatus,
    getStatus,
    isStates,
    getStates,
    isMessage,
    getMessage,
    isAlarm,
    getAlarm,
    isError,
    getError,
    isGcodeParameter,
    getGcodeParameter,
    isVersion,
    getVersion,
    isOptions,
    getOptions,
    isReset,
    isStreamingStatus,
    getStreamingStatus,
} from "./filters"

const lastPins: PinsStates = {}

/*
 * Local const
 *
 */
const TargetContext = createContext<TargetContextValue | undefined>(undefined)
const useTargetContext = (): TargetContextValue => {
    const context = useContext(TargetContext)
    if (!context) {
        throw new Error("useTargetContext must be used within a TargetContextProvider")
    }
    return context
}
const useTargetContextFn = {} as TargetContextFn

useTargetContextFn.isStaId = (subsectionId: string, label: string, _fieldData: unknown) => {
    if (subsectionId == "sta" && label == "SSID") return true
    return false
}


interface TargetContextProviderProps {
    children: VNode | VNode[]
}

const TargetContextProvider = ({ children }: TargetContextProviderProps) => {
    const [positions, setPositions] = useState<Positions>({
        x: "?",
        y: "?",
        z: "?",
    })
    const [status, setStatus] = useState<Status>({ state: "?" })
    // overrides/grblVersion/grblSettings: no consumer reads these fields off
    // TargetContextValue today (see the audit note in types.ts), and their
    // setters receive whatever shape the corresponding response parses to
    // (override percentages, version/build info) - not worth inventing a
    // shape for data nothing currently uses.
    const [overrides, setOverrides] = useState<Record<string, any>>({})
    const [pinsStates, setPinStates] = useState<PinsStates>(lastPins)
    const [states, setStates] = useState<StatesMap>({})
    const [streamStatus, setStreamStatus] = useState<StreamStatus>({})
    const [message, setMessage] = useState<string | undefined>()
    const [alarmCode, setAlarmCode] = useState(0)
    const [errorCode, setErrorCode] = useState(0)
    const [gcodeParameters, setGcodeParameters] = useState<GcodeParameters>({})
    const [grblVersion, setGrblVersion] = useState<Record<string, any>>({})
    const [grblSettings, setGrblSettings] = useState<Record<string, any>>({})
    const gcodeParametersRef = useRef<GcodeParameters>({})
    // lastStatus/lastStates used to be plain module-level objects accessed via a
    // nonexistent `.current` property (a copy-paste ref look-alike, not a real
    // ref). TargetContextProvider only ever mounts once, so converting them to
    // real per-instance refs changes nothing observable, it just makes the
    // `.current` access actually type- and runtime-correct.
    const lastStatusRef = useRef<Status | null>(null)
    const lastStatesRef = useRef<StatesMap | null>(null)
    const { terminal } = useDatasContext()
    const dataBuffer = useRef<Record<string, string>>({
        stream: "",
        core: "",
        response: "",
        error: "",
        echo: "",
    })

    const dispatchInternally = (type: string, data: string) => {
        //files
        processor.handle(type, data)
        //sensors
        //status
        if (type == "core" && data == "ESP800") {
            if (useSettingsContextFn.getValue("Axisletters")) {
                if (positions.x == "?") {
                    setPositions(
                        useSettingsContextFn
                            .getValue("Axisletters")
                            .split("")
                            .reduce((acc: Record<string, string>, letter: string) => {
                                acc[letter.toLowerCase()] = "?"
                                return acc
                            }, {})
                    )
                }
            }
        }
        if (type === "stream") {
            if (isOk(data)) {
                //just ignore this one so we can continue
            } else if (isStatus(data)) {
                //status
                const response = getStatus(data)
                //For Pn we need to keep the last value to keep trace the pin is detected or not,
                //so we can display the pin icon when disabled even no data is received
                if (
                    Object.keys(lastPins).length > 0 ||
                    Object.keys(response.pn).length > 0
                ) {
                    Object.keys(response.pn).forEach((key) => {
                        lastPins[key] = response.pn[key]
                    })
                    Object.keys(lastPins).forEach((key) => {
                        if (!response.pn[key]) {
                            lastPins[key] = false
                        }
                    })
                }
                setPinStates(lastPins)
                if (response.positions) {
                    setPositions(response.positions)
                    const names = [
                        "x",
                        "y",
                        "z",
                        "a",
                        "b",
                        "c",
                        "wx",
                        "wy",
                        "wz",
                        "wa",
                        "wb",
                        "wc",
                    ]
                    names.forEach((element) => {
                        let name = `#pos_${  element  }#`
                        variablesList.addCommand({
                            name: name,
                            value: parseFloat(
                                String(
                                    response.positions[element]
                                        ? response.positions[element]
                                        : 0
                                )
                            ),
                        })
                    })
                }
if (response.status) {
    const newStatus: Status = {
        ...response.status,
    }

    // Propagate spindle power reading onto the status object
    if (response.power && typeof response.power.value === "number") {
        newStatus.power = response.power
    }

    setStatus(newStatus)

    if (lastStatusRef.current !== newStatus) {
        lastStatusRef.current = newStatus
        if (
            !(
                newStatus.state == "Alarm" ||
                newStatus.state == "Idle" ||
                newStatus.state == "Sleep"
            )
        ) {
            setMessage("")
        }
        if (
            !(
                newStatus.state == "Alarm" ||
                newStatus.state == "Error"
            )
        ) {
            setAlarmCode(0)
            setErrorCode(0)
        }
    }
}

                if (response.ov) {
                    setOverrides(response.ov)
                }
                if (response.f) {
                    //Update state accordingly
                    if (!lastStatesRef.current) lastStatesRef.current = {}
                    if (typeof response.f.value != "undefined")
                        lastStatesRef.current.feed_rate = {
                            value: response.f.value,
                        }
                    if (typeof response.rpm.value != "undefined")
                        lastStatesRef.current.spindle_speed = {
                            value: response.rpm.value,
                        }
                    setStates(lastStatesRef.current)
                }
                if (response.sd) {
                    setStreamStatus(response.sd)
                }
                //more to set+
                //....
            }
            //ALARM
            if (isAlarm(data)) {
                const response = getAlarm(data)
                setAlarmCode(response as number)
                setErrorCode(0)
                setMessage("")
                setStatus({ state: "Alarm" })
                eventsList.emit("alarm", data)
            }

            //error
            if (isError(data)) {
                const response = getError(data)
                setErrorCode(response as number)
                setAlarmCode(0)
                setMessage("")
                setStatus({ state: "Error" })
                eventsList.emit("error", data)
            }
            //prefiltering
            if (data[0] === "[") {
                if (isStates(data)) {
                    lastStatesRef.current = getStates(data)
                    setStates(lastStatesRef.current)
                }

                if (isMessage(data)) {
                    const response = getMessage(data)
                    setMessage(response as string)
                }
                if (isGcodeParameter(data)) {
                    const response = getGcodeParameter(data)
                    if (response) {
                        gcodeParametersRef.current[response.code] = {
                            data: [...response.data],
                        }
                        if (typeof response.success !== "undefined") {
                            gcodeParametersRef.current[response.code].success =
                                response.success
                        }
                        if (gcodeParametersRef.current.PRB) {
                            //the PRB is x y z even
                            //TODO:
                            //should use the xyzabc or xyzabcuv or xyzuvw instead
                            const defaultletters = "xyzabc"
                            const definedletters =
                                useSettingsContextFn.getValue("Axisletters")
                            const letterslist = definedletters && typeof definedletters === 'string'
                                ? definedletters.toLowerCase().split("")
                                : defaultletters.split("");
                            gcodeParametersRef.current.PRB.data.forEach(
                                (value: string, index: number) => {
                                    let name = `#prb_${ letterslist[index] }#`
                                    variablesList.addCommand({
                                        name: name,
                                        value: parseFloat(value),
                                    })
                                }
                            )
                        }
                        setGcodeParameters(gcodeParametersRef.current)
                    }
                }
                if (isVersion(data)) {
                    const response = getVersion(data)
                    if (response) setGrblVersion(response)
                }
                if (isOptions(data)) {
                    const response = getOptions(data)
                    if (response) setGrblSettings(response)
                }
            }
            if (isReset(data)) {
                eventsList.emit("reset", data)
            }
        }
        if (type === "response") {
            //check if the response is a command answer
            if (data[0] === "{") {
                if (isStreamingStatus(data)) {
                    const status = getStreamingStatus(data)
                    setStreamStatus(status)
                }
            }
        }
        //etc...
    }
    const processData = (type: string, data: string, noecho = false) => {
        if (data.length > 0) {
            if (type == "stream") {
                //TODO
                //need to handle \r \n and even not having some
                //this will split by char
                data.split("").forEach((element) => {
                    if (element == "\n" || element == "\r") {
                        if (dataBuffer.current[type].length > 0) {
                            const isverboseOnly = isVerboseOnly(
                                type,
                                dataBuffer.current[type]
                            )
                            dispatchInternally(type, dataBuffer.current[type])
                            //format the output if needed
                            if (dataBuffer.current[type].startsWith("{")) {
                                const newbuffer = beautifyJSONString(
                                    dataBuffer.current[type]
                                )
                                if (newbuffer == "error")
                                    terminal.add({
                                        type,
                                        content: dataBuffer.current[type],
                                        isverboseOnly,
                                    })
                                else {
                                    terminal.add({
                                        type,
                                        content: newbuffer,
                                        isverboseOnly,
                                    })
                                }
                            } else {
                                //if not json
                                terminal.add({
                                    type,
                                    content: dataBuffer.current[type],
                                    isverboseOnly,
                                })
                            }

                            dataBuffer.current[type] = ""
                        }
                    } else {
                        dataBuffer.current[type] += element
                    }
                })
            } else if (type == "response") {
                //ignore such answer unless need to check response
                //this response is to workaround some response lost when no response
                if (data.startsWith("ESP3D says:")) return
                const isverboseOnly = isVerboseOnly(type, data)
                dispatchInternally(type, data)
                //format the output if needed
                if (data.startsWith("{")) {
                    const newbuffer = beautifyJSONString(data)
                    if (newbuffer == "error")
                        terminal.add({
                            type,
                            content: data,
                            isverboseOnly,
                        })
                    else {
                        if (!noecho)
                            terminal.add({
                                type,
                                content: newbuffer,
                                isverboseOnly,
                            })
                    }
                } else {
                    if (!noecho)
                        terminal.add({
                            type,
                            content: data,
                            isverboseOnly,
                        })
                }
            } else {
                if (type != "core") {
                    const isverboseOnly = isVerboseOnly(type, data)
                    terminal.add({ type, content: data, isverboseOnly })
                }
                dispatchInternally(type, data)
            }
            dispatchToExtensions(type, data)
        }
    }

    useTargetContextFn.processData = processData

    const store = useMemo<TargetContextValue>(
        () => ({
            positions,
            streamStatus,
            status,
            states,
            pinsStates,
            message,
            alarmCode,
            errorCode,
            overrides,
            gcodeParameters,
            grblVersion,
            grblSettings,
            processData,
        }),
        // processData is a large, non-memoized function recreated every render; adding it below
        // would recompute (and re-render every consumer of) this context value on every render
        // instead of only when the underlying machine data actually changes. In practice `store`
        // already recomputes very frequently via the other deps below, so processData is rarely
        // stale for more than one update cycle.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [
            positions,
            streamStatus,
            status,
            states,
            pinsStates,
            message,
            alarmCode,
            errorCode,
            overrides,
            gcodeParameters,
            grblVersion,
            grblSettings
        ]
    )

    return (
        <TargetContext.Provider value={store}>
            {children}
        </TargetContext.Provider>
    )
}

export { TargetContextProvider, useTargetContext, useTargetContextFn }
