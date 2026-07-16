/*
 UiContext.tsx - ESP3D WebUI context file

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
import { createContext, FunctionalComponent, ComponentChildren } from "preact"
import { useContext, useState, useRef, useEffect, useCallback, useMemo } from "preact/hooks"
import { initAudio, playTones, type SoundNote } from "./Ui/audioEngine"
import { vibrate } from "./Ui/haptics"
import { usePanelsVisibility, type Panel, type PanelsVisibility } from "./Ui/usePanelsVisibility"
import { getSettingsValue, getSettingsElement } from "./Ui/settingsTree"

interface ConnectionState {
    connected: boolean
    page: string
    extraMsg?: string
    updating?: boolean
}

interface UiSettings {
    // any: getValue/getElement's base can be the interfaceSettings tree (real
    // shape: PreferencesSection) or, defensively, other settings-like objects -
    // see settingsTree.ts.
    getValue: (id: string, base?: any) => any
    getElement: (id: string, base?: any) => any
    current: any
    set: (settings: any) => void
    refreshPaused: Record<string, boolean>
}

interface UiContextValue {
    // Currently unused across the codebase (nothing ever assigns into it besides
    // this ref's own initial {}); kept as-is rather than removed since that's a
    // dead-code cleanup, not a typing one.
    timerIDs: { current: Record<string, unknown> }
    panels: PanelsVisibility
    shortcuts: {
        enabled: boolean
        enable: (enabled: boolean) => void
    }
    uisettings: UiSettings
    connection: {
        connectionState: ConnectionState
        setConnectionState: (state: ConnectionState) => void
    }
    dialogs: {
        showKeepConnected: boolean
        setShowKeepConnected: (show: boolean) => void
    }
    ui: {
        ready: boolean
        setReady: (ready: boolean) => void
    }
    toolNumbers: {
        vfd: number | null
        laser: number | null
    }
    setToolNumbers: (tools: { vfd: number | null; laser: number | null }) => void
}

interface UiContextFn {
    getValue: (id: string, base?: any) => any
    getElement: (id: string, base?: any) => any
    haptic: (pattern?: number | number[]) => void
    click: () => void
    playSound: (sequence: SoundNote[]) => void
    beep: () => void
    beepError: () => void
    beepSeq: (seq: SoundNote[] | undefined) => void
    panels: {
        hide: (id: string) => void
        isVisible: (id: string) => boolean
    }
}

const useUiContextFn: UiContextFn = {} as UiContextFn

/*
 * Local const
 *
 */
const UiContext = createContext<UiContextValue | undefined>(undefined)
const useUiContext = () => {
    const context = useContext(UiContext)
    if (!context) {
        throw new Error("useUiContext must be used within a UiContextProvider")
    }
    return context
}

interface UiContextProviderProps {
    children: ComponentChildren
}

const UiContextProvider: FunctionalComponent<UiContextProviderProps> = ({ children }) => {
    const panels = usePanelsVisibility()
    const timersList = useRef<Record<string, unknown>>({})
    const [uiSettings, setUISettings] = useState<any>()
    const uiRefreshPaused = useRef<Record<string, boolean>>({})
    const [isKeyboardEnabled, setIsKeyboardEnabled] = useState<boolean>(false)
    const [showKeepConnected, setShowKeepConnected] = useState<boolean>(false)
    const [connectionState, setConnectionState] = useState<ConnectionState>({
        connected: false,
        page: "connecting",
    })
    const [uiSetup, setUiSetup] = useState<boolean>(false)
    const [toolNumbers, setToolNumbers] = useState<{
        vfd: number | null
        laser: number | null
    }>({
        vfd: null,
        laser: null,
    })

    const getElement = useCallback((Id: string, base: any = null): any => {
        return getSettingsElement(base ? base : uiSettings, Id)
    }, [uiSettings])

    const getValue = useCallback((Id: string, base: any = null): any => {
        return getSettingsValue(base ? base : uiSettings, Id)
    }, [uiSettings])

    useUiContextFn.getValue = getValue
    useUiContextFn.getElement = getElement

    const haptic = (pattern?: number | number[]) => {
        vibrate(getValue("hapticfeedback"), pattern)
    }

    useUiContextFn.haptic = haptic

    //play sequence
    const play = (sequence?: SoundNote[]) => {
        if (!getValue("audio")) return
        playTones(sequence)
    }
    useUiContextFn.playSound = play

    useUiContextFn.click = () => {
        if (!getValue("audiofeedback")) return
        play([{ f: 1800, d: 25 }])
    }
    //beep
    useUiContextFn.beep = () => {
        play([
            { f: 1567, d: 100 },
            { f: 1318, d: 100 },
            { f: 1046, d: 100 },
        ])
    }
    //beep error
    useUiContextFn.beepError = () => {
        play([
            { f: 260, d: 80 },
            { f: 260, d: 80 },
        ])
    }
    //sequence
    useUiContextFn.beepSeq = (seq: SoundNote[] | undefined) => {
        if (!seq) return
        play(seq)
    }

    useUiContextFn.panels = { hide: panels.hide, isVisible: panels.isVisible }

    useEffect(() => {
        initAudio()
    }, [])

    const store: UiContextValue = useMemo(() => ({
        timerIDs: timersList,
        panels,
        shortcuts: {
            enabled: isKeyboardEnabled,
            enable: setIsKeyboardEnabled,
        },
        uisettings: {
            current: uiSettings,
            set: setUISettings,
            getValue,
            getElement,
            refreshPaused: uiRefreshPaused.current,
        },
        connection: {
            connectionState,
            setConnectionState,
        },

        dialogs: {
            showKeepConnected,
            setShowKeepConnected,
        },
        ui: {
            ready: uiSetup,
            setReady: setUiSetup,
        },
        toolNumbers,
        setToolNumbers,

        // Deliberately depend on panels' individual fields rather than the
        // `panels` object itself: usePanelsVisibility() returns a fresh object
        // every render, so depending on it directly would defeat this memo.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [
        panels.list,
        panels.setVisibles,
        panels.hide,
        panels.show,
        panels.isVisible,
        panels.initDone,
        panels.setPanelsOrder,
        panels.updateTrigger,
        isKeyboardEnabled,
        uiSettings,
        getValue,
        getElement,
        connectionState,
        showKeepConnected,
        uiSetup,
        toolNumbers,
    ])

    return <UiContext.Provider value={store}>{children}</UiContext.Provider>
}

export { UiContextProvider, useUiContext, useUiContextFn }
export type { UiContextValue, UiContextFn, UiSettings, Panel, ConnectionState, SoundNote }
