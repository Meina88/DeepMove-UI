/*
 index.tsx - ESP3D WebUI WiFi Settings Tab

 Copyright (c) 2025 Mike Melancon. All rights reserved.

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
import { Fragment, TargetedMouseEvent } from "preact"
import { useState, useEffect } from "preact/hooks"
import { useToastsContext, useUiContextFn } from "../../contexts"
import { ButtonImg, Loading } from "../../components/Controls"
import Input from "../../components/Controls/Fields/Input"
import Select from "../../components/Controls/Fields/Select"
import { Save } from "preact-feather"
import { T } from "../../components/Translations"
import WifiStats from "./WifiStats"
import { getWebSocketService } from "../../hooks/useWebSocketService"
import { GetSettingsCommand, Settings } from "../../Services/Commands/GetSettingsCommand"
import { Command } from "../../Services/Commands/Command"
import { useTargetCommands } from "../../hooks"
import { useModalsContext } from "../../contexts"
import { showModal } from "../../components/Modal"
import { showConfirmationModal } from "../../components/Modal"



export type SystemStats = {
    version?: string
    ip?: string
    hostname?: string
    ipMode?: string
    gateway?: string
    netmask?: string
    dns?: string
    channel?: string
    signal?: string
    apSSID?: string
    wifiMode?: string
    flashSize?: string
    cpuTemperature?: string
    currentWifiMode?: string
    connectedTo?: string
}

const encodePassword = (password: string): string => {
    return password.replace("%", "%25").replace("!", "%21").replace("?", "%3F").replace("~", "%75")
}

const normalizeMode = (mode?: string) => (mode || "").trim().toUpperCase()

const getRuntimeMode = (mode?: string) => {
    const value = normalizeMode(mode)

    if (value.startsWith("AP")) return "AP"
    if (value.startsWith("STA")) return "STA"
    if (value === "OFF" || value === "NONE") return "OFF"

    return ""
}

const WifiTab = () => {
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [isSaving, setIsSaving] = useState<boolean>(false)
    const [hasChanges, setHasChanges] = useState<boolean>(false)
    const { targetCommands } = useTargetCommands()
    const controllerService = getWebSocketService();
    const { toasts } = useToastsContext()
    const { modals } = useModalsContext()
    // Settings state
    const [originalSettings, setOriginalSettings] = useState<Settings>({})

    // Stats state
    const [wifiStats, setWifiStats] = useState<SystemStats>({})

    // Form state
    const [hostname, setHostname] = useState<string>("")
    const [wifiMode, setWifiMode] = useState<string>("")
    const [stationSSID, setStationSSID] = useState<string>("")
    const [stationPassword, setStationPassword] = useState<string>("")
    const [stationMinSecurity, setStationMinSecurity] = useState<string>("")
    const [stationIpMode, setStationIpMode] = useState<string>("")
    const [stationIP, setStationIP] = useState<string>("")
    const [stationGateway, setStationGateway] = useState<string>("")
    const [stationNetmask, setStationNetmask] = useState<string>("")
    const [apSSID, setApSSID] = useState<string>("")
    const [apPassword, setApPassword] = useState<string>("")
    const [apChannel, setApChannel] = useState<string>("")
    const [apIP, setApIP] = useState<string>("")
    const [apCountry, setApCountry] = useState<string>("")
    const [apPasswordError, setApPasswordError] = useState<string>("")
    const [staPasswordError, setStaPasswordError] = useState<string>("")

    // Wrapper functions to convert callbacks to match Input/Select signatures
    const handleHostnameChange = (value: string | number | null) => {
        if (value !== null) setHostname(String(value))
    }

    const handleWifiModeChange = (value: string | null) => {
        if (value !== null) setWifiMode(value)
    }

    const handleStationSSIDChange = (value: string | number | null) => {
        if (value !== null) setStationSSID(String(value))
    }

    const handleStationPasswordChange = (value: string | number | null) => {
        if (value !== null) setStationPassword(String(value))
    }

    const handleStationMinSecurityChange = (value: string | null) => {
        if (value !== null) setStationMinSecurity(value)
    }

    const handleStationIpModeChange = (value: string | null) => {
        if (value !== null) setStationIpMode(value)
    }

    const handleStationIPChange = (value: string | number | null) => {
        if (value !== null) setStationIP(String(value))
    }

    const handleStationGatewayChange = (value: string | number | null) => {
        if (value !== null) setStationGateway(String(value))
    }

    const handleStationNetmaskChange = (value: string | number | null) => {
        if (value !== null) setStationNetmask(String(value))
    }

    const handleApSSIDChange = (value: string | number | null) => {
        if (value !== null) setApSSID(String(value))
    }

    const handleApPasswordChange = (value: string | number | null) => {
        if (value !== null) setApPassword(String(value))
    }

    const handleApCountryChange = (value: string | null) => {
        if (value !== null) setApCountry(value)
    }

    const handleApChannelChange = (value: string | number | null) => {
        if (value !== null) setApChannel(String(value))
    }

    const handleApIPChange = (value: string | number | null) => {
        if (value !== null) setApIP(String(value))
    }

    const getParam = (data: any, param: string): string | undefined => {
        return data?.find((field: any) => field.id.replace(": ", "") === param)?.value
    }

    // Load WiFi settings on component mount
    const loadSettings = async () => {
        setIsLoading(true)
        try {
            await controllerService
                ?.send(new GetSettingsCommand())
                .then((command) => {
                    const settings = command.getSettings();
                    setOriginalSettings(settings);
                    setWifiMode(settings.wifiMode || "");
                    setHostname(settings.hostname || "");
                    setStationSSID(settings.stationSSID || "");
                    setStationIpMode(settings.stationIpMode || "");
                    setStationPassword("")
                    setApPassword("")
                    setStationIP(settings.stationIP || "");
                    setStationGateway(settings.stationGateway || "");
                    setStationNetmask(settings.stationNetmask || "");
                    setApSSID(settings.apSSID || "");
                    setApChannel(settings.apChannel || "");
                    setApIP(settings.apIP || "");
                    setApCountry(settings.apCountry || "");
                    setIsLoading(false)
                }).catch((error) => {
                    setIsLoading(false)
                    console.error("Failed to load WiFi settings:", error)
                });

        } catch {
            setIsLoading(false)
        }
    }

    const getWifiStats = (): void => {
        setIsLoading(true)

        targetCommands("[ESP420]json=yes", undefined, { echo: false }, {
            onSuccess: (result: any) => {
                const jsonResult = JSON.parse(result)
                if (jsonResult.cmd != 420 || jsonResult.status == "error" || !jsonResult.data) {
                    toasts.addToast({ content: T("S194"), type: "error" })
                    setIsLoading(false)
                    return
                }

                const wifiStatistics = {
                    version: getParam(jsonResult.data, "FWversion"),
                    ip: getParam(jsonResult.data, "IP"),
                    hostname: getParam(jsonResult.data, "Hostname"),
                    ipMode: getParam(jsonResult.data, "IP Mode"),
                    gateway: getParam(jsonResult.data, "Gateway"),
                    netmask: getParam(jsonResult.data, "Mask"),
                    dns: getParam(jsonResult.data, "DNS"),
                    channel: getParam(jsonResult.data, "Channel"),
                    signal: getParam(jsonResult.data, "Signal"),
                    wifiMode: getParam(jsonResult.data, "Current WiFi Mode"),
                    flashSize: getParam(jsonResult.data, "Flash Size"),
                    cpuTemperature: getParam(jsonResult.data, "CPU Temperature"),
                    currentWifiMode: getParam(jsonResult.data, "Current WiFi Mode"),
                    apSSID: getParam(jsonResult.data, "SSID"),
                    connectedTo: getParam(jsonResult.data, "Connected to"),
                }
                setWifiStats(wifiStatistics)

                // // setProps([...jsonResult.data])
                // // about = [...jsonResult.data]
                setIsLoading(false)
            },
            onFail: (error: any) => {
                setIsLoading(false)
                toasts.addToast({ content: error, type: "error" })
                console.log(error)
            }
        })

    }

    // Refresh WiFi stats
    const refreshWifiStats = async () => {
        try {
            getWifiStats()
        } catch (error) {
            console.error("Failed to refresh WiFi stats:", error)
        }
    }

    // Check if settings have changed
    useEffect(() => {
        const changed =
            hostname !== originalSettings.hostname ||
            wifiMode !== originalSettings.wifiMode ||
            stationSSID !== originalSettings.stationSSID ||
            stationPassword !== "" ||
            stationMinSecurity !== originalSettings.stationMinSecurity ||
            stationIpMode !== originalSettings.stationIpMode ||
            stationIP !== originalSettings.stationIP ||
            stationGateway !== originalSettings.stationGateway ||
            stationNetmask !== originalSettings.stationNetmask ||
            apSSID !== originalSettings.apSSID ||
            apPassword !== "" ||
            apChannel !== originalSettings.apChannel ||
            apIP !== originalSettings.apIP ||
            apCountry !== originalSettings.apCountry

        setHasChanges(changed)
    }, [
        hostname,
        wifiMode,
        stationSSID,
        stationPassword,
        stationMinSecurity,
        stationIpMode,
        stationIP,
        stationGateway,
        stationNetmask,
        apSSID,
        apPassword,
        apChannel,
        apIP,
        apCountry,
        originalSettings,
    ])

    useEffect(() => {
        // AP validation
        if ((wifiMode === "AP" || wifiMode === "STA>AP") && apPassword) {
            if (apPassword.length < 8) {
                setApPasswordError("Debe tener al menos 8 caracteres")
            } else {
                setApPasswordError("")
            }
        } else {
            setApPasswordError("")
        }

        // STA validation
        if ((wifiMode === "STA" || wifiMode === "STA>AP") && stationPassword) {
            if (stationPassword.length < 8) {
                setStaPasswordError("Debe tener al menos 8 caracteres")
            } else {
                setStaPasswordError("")
            }
        } else {
            setStaPasswordError("")
        }

    }, [apPassword, stationPassword, wifiMode])

    const handleSaveWithConfirmation = () => {

        const prevMode = getRuntimeMode(wifiStats.currentWifiMode || wifiStats.wifiMode)
        const newMode = normalizeMode(wifiMode)

        // Detectar cambio relevante
        const isAPtoSTA = (prevMode === "AP") && (newMode === "STA>AP" || newMode === "STA")
        const isSTAtoAP = (prevMode === "STA") && (newMode === "AP")

        if (!isAPtoSTA && !isSTAtoAP) {
            saveSettings()
            return
        }

        const host = hostname || "fluidnc"
        const url = `http://${host}.local/`

        let content = null

        if (isAPtoSTA) {
            content = (
                <div>
                    <p><b>Se perderá la conexión al cambiar a modo STA.</b></p>
                    <p>Siga estos pasos después de guardar:</p>
                    <p>
                        A. Reinicie el controlador de su máquina.<br />
                        B. Vuelva a conectarse a su red WiFi.<br />
                        C. Abra DeepMove desde:<br />
                        <a href={url} target="_blank" rel="noopener noreferrer">
                            {url}
                        </a>
                    </p>
                </div>
            )
        }

        if (isSTAtoAP) {
            content = (
                <div>
                    <p><b>Se perderá la conexión al cambiar a modo AP.</b></p>
                    <p>Después de guardar siga estos pasos:</p>
                    <p>
                        A. Reinicie el controlador de su máquina.<br />
                        B. Conéctese a la red WiFi generada por su máquina.<br />
                        C. Abra DeepMove desde:<br />
                        <a href={url} target="_blank" rel="noopener noreferrer">
                            {url}
                        </a>
                    </p>
                </div>
            )
        }

        showConfirmationModal({
            modals,
            title: "Cambio de modo WiFi",
            content,
            button1: {
                text: "Cancelar",
            },
            button2: {
                text: "Guardar",
                cb: () => saveSettings(),
            },
        })
    }

    // Save settings
    const saveSettings = async () => {
        setIsSaving(true)
        try {
            if (hostname !== originalSettings?.hostname) {
                await controllerService?.send(
                    new Command(`$Hostname=${hostname}`)
                );
            }

            if (wifiMode !== originalSettings?.wifiMode) {
                await controllerService?.send(
                    new Command(`$WiFi/Mode=${wifiMode}`)
                );
            }

            if (stationSSID !== originalSettings?.stationSSID) {
                await controllerService?.send(
                    new Command(`$Sta/SSID=${stationSSID}`)
                );
            }

            if (stationIpMode !== originalSettings?.stationIpMode) {
                await controllerService?.send(
                    new Command(`$Sta/IPMode=${stationIpMode}`)
                );
            }

            if (stationPassword && stationPassword !== "********") {
                await controllerService?.send(
                    new Command(
                        `$Sta/Password=${encodePassword(stationPassword ?? "")}`
                    )
                );
            }

            if (stationMinSecurity !== originalSettings?.stationMinSecurity) {
                await controllerService?.send(
                    new Command(`$Sta/MinSecurity=${stationMinSecurity}`)
                );
            }

            if (stationIP !== originalSettings?.stationIP) {
                await controllerService?.send(
                    new Command(`$Sta/IP=${stationIP}`)
                );
            }

            if (stationGateway !== originalSettings?.stationGateway) {
                await controllerService?.send(
                    new Command(`$Sta/Gateway=${stationGateway}`)
                );
            }

            if (stationNetmask !== originalSettings?.stationNetmask) {
                await controllerService?.send(
                    new Command(`$Sta/Netmask=${stationNetmask}`)
                );
            }

            if (apSSID !== originalSettings?.apSSID) {
                await controllerService?.send(
                    new Command(`$AP/SSID=${apSSID}`)
                );
            }

            if (apPassword && apPassword !== "********") {
                await controllerService?.send(
                    new Command(
                        `$AP/Password=${encodePassword(apPassword ?? "")}`
                    )
                );
            }

            if (apChannel !== originalSettings?.apChannel) {
                await controllerService?.send(
                    new Command(`$AP/Channel=${apChannel}`)
                );
            }

            if (apIP !== originalSettings?.apIP) {
                await controllerService?.send(new Command(`$AP/IP=${apIP}`));
            }

            if (apCountry !== originalSettings?.apCountry) {
                await controllerService?.send(
                    new Command(`$AP/Country=${apCountry}`)
                );
            }

            // Reload settings after save
            await loadSettings()
            useUiContextFn.haptic()
        } catch (error) {
            console.error("Failed to save settings:", error)
        } finally {
            setIsSaving(false)
        }
    }

    // Load settings on mount
    useEffect(() => {
        loadSettings()
        refreshWifiStats()
    }, [])

    let style: string = hasChanges ? "max-height: calc(100dvh - 170px); overflow-y: scroll;" : "max-height: 100%; overflow-y: scroll;"

    return (
        <Fragment>
            <div id="interface" style={style}>
                {isLoading && <Loading large />}
                {!isLoading && (
                    <Fragment>
                        {/*<h1 class="title">{T("S35")}</h1>*/}
                        <div class="container my-2" >
                            <div class="columns">
                                <div class="column col-2 col-lg-2 col-md-1 col-sm-0 col-xs-0"></div>
                                <div class="column col-8 col-lg-8 col-md-10 col-sm-12 col-xs-12">
                                    {/* Main Settings - Label and Input on same row */}

                                    <div className="columns">
                                        <div className="column col-3 col-lg-3 col-md-4 col-sm-4 my-2">{T("S332")}</div>
                                        <div className="column col-9 col-lg-9 col-md-8 col-sm-8">
                                            <Input
                                                id="hostname"
                                                type="text"
                                                value={hostname}
                                                setValue={handleHostnameChange}
                                                disabled={isSaving}
                                            />
                                        </div>
                                    </div>

                                    <div className="columns">
                                        <div className="column col-3 col-lg-3 col-md-4 col-sm-4 my-2">
                                            {T("S312")}
                                        </div>

                                        <div className="column col-9 col-lg-9 col-md-8 col-sm-8" style={{ display: "flex", alignItems: "center", gap: "8px" }}>

                                            <Select
                                                id="wifiMode"
                                                value={wifiMode}
                                                setValue={handleWifiModeChange}
                                                disabled={isSaving}
                                                options={[
                                                    {
                                                        label: "OFF",
                                                        value: "Off",
                                                    },
                                                    {
                                                        label: "STA > AP",
                                                        value: "STA>AP",
                                                    },

                                                    // 🔒 OCULTO PERO DISPONIBLE
                                                    // {
                                                    //     label: "STA",
                                                    //     value: "STA",
                                                    // },

                                                    {
                                                        label: "AP",
                                                        value: "AP",
                                                    },
                                                ]}
                                            />

                                            {/* 🔵 Botón INFO */}
                                            <button
                                                style={{
                                                    width: "28px",
                                                    height: "28px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    borderRadius: "6px",
                                                    background: "var(--ms-btn-base-bg)",
                                                    color: "var(--ms-text-normal)",
                                                    border: "1px solid var(--ms-border)",
                                                    boxShadow: "var(--neo-shadow-soft)",
                                                    cursor: "pointer",
                                                }}
                                                onClick={() => {

                                                    showModal({
                                                        modals,
                                                        id: "wifi_mode_info",
                                                        title: "WiFi Modes",
                                                        content: (
                                                            <div>
                                                                <p>
                                                                    <b>Access Point mode (AP):</b><br />
                                                                    Su dispositivo se comunica directamente con su máquina.<br />
                                                                    Utilice este modo solo para la configuración inicial.<br />
                                                                    <b>No es recomendado para uso normal.</b>
                                                                </p>

                                                                <p>
                                                                    <b>Client station mode (STA &gt; AP):</b><br />
                                                                    Su dispositivo se conecta a la máquina a través de su red WiFi.<br />
                                                                    Es el modo principal de operación y el más estable.<br />

                                                                    <b>Fallback automático:</b><br />
                                                                    Si la conexión falla, el dispositivo volverá automáticamente a modo AP.
                                                                </p>
                                                            </div>
                                                        ),
                                                        button1: { text: "OK" },
                                                    })
                                                }}
                                            >
                                                ℹ️
                                            </button>

                                        </div>
                                    </div>

                                    {/* WiFi Stats Box */}
                                    <div class="columns" style="margin-top: 10px">
                                        <div class="column col-4 col-lg-4 col-md-2 col-sm-0 col-xs-0"></div>
                                        <div class="column col-8 col-lg-8 col-md-10 col-sm-12 col-xs-12">
                                            <WifiStats stats={wifiStats} onRefresh={refreshWifiStats} />{" "}
                                        </div>
                                    </div>

                                    {/* Client Station Settings */}
                                    {(wifiMode === "STA>AP" || wifiMode === "STA") && (
                                        <Fragment>
                                            <h4 style={{ marginTop: "24px" }}>{T("S313")}</h4>
                                            {/* 🔹 Texto explicativo */}
                                            <div style={{ marginBottom: "8px", fontSize: "12px", opacity: 0.8 }}>
                                                Escriba manualmente el nombre de la red WiFi a la que quiere conectar su máquina
                                            </div>

                                            {/* SSID */}
                                            <div className="columns">
                                                <div className="column col-3 col-lg-3 col-md-4 col-sm-4 my-2">
                                                    {T("S315")}:
                                                </div>

                                                <div className="column col-9 col-lg-9 col-md-8 col-sm-8" style={{ display: "flex", alignItems: "center", gap: "8px" }}>

                                                    <Input
                                                        id="ssid_sta"
                                                        type="text"
                                                        value={stationSSID}
                                                        setValue={handleStationSSIDChange}
                                                        disabled={isSaving}
                                                    // ❌ eliminado: extra="scan"
                                                    />

                                                    {/* 🔵 INFO */}
                                                    <button
                                                        style={{
                                                            width: "28px",
                                                            height: "28px",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            borderRadius: "6px",
                                                            background: "var(--ms-btn-base-bg)",
                                                            color: "var(--ms-text-normal)",
                                                            border: "1px solid var(--ms-border)",
                                                            boxShadow: "var(--neo-shadow-soft)",
                                                            cursor: "pointer",
                                                        }}
                                                        onClick={() => {

                                                            showModal({
                                                                modals,
                                                                id: "ssid_info",
                                                                title: "WiFi networks",
                                                                content: (
                                                                    <div>
                                                                        <b>Configuración manual:</b>
                                                                        <br />
                                                                        <br />
                                                                        <p>
                                                                            En modo AP no es posible escanear redes WiFi. Ingrese el nombre (SSID) y el password de su red WiFi para configurar el modo STA.
                                                                        </p>
                                                                    </div>
                                                                ),
                                                                button1: { text: "OK" },
                                                            })
                                                        }}
                                                    >
                                                        ℹ️
                                                    </button>

                                                </div>
                                            </div>

                                            <div className="columns">
                                                <div className="column col-3 col-lg-3 col-md-4 col-sm-4 my-2">{T("S316")}:</div>
                                                <div className="column col-9 col-lg-9 col-md-8 col-sm-8">
                                                    <Input
                                                        id="password_sta"
                                                        type="password"
                                                        value={stationPassword}
                                                        setValue={handleStationPasswordChange}
                                                        disabled={isSaving}
                                                        style={{
                                                            border: staPasswordError ? "1px solid var(--ms-error)" : undefined
                                                        }}
                                                    />
                                                    {staPasswordError && (
                                                        <div style={{ color: "var(--ms-error)", fontSize: "12px", marginTop: "4px" }}>
                                                            {staPasswordError}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Min Security and IP Mode */}
                                            <div className="columns">
                                                <div className="column col-3 col-lg-3 col-md-4 col-sm-4 my-2">{T("S320")}:</div>
                                                <div className="column col-9 col-lg-9 col-md-8 col-sm-8">
                                                    <Select
                                                        id="minSecurity_sta"
                                                        value={stationMinSecurity}
                                                        setValue={handleStationMinSecurityChange}
                                                        disabled={isSaving}
                                                        options={[
                                                            {
                                                                label: "OPEN",
                                                                value: "OPEN",
                                                            },
                                                            {
                                                                label: "WEP",
                                                                value: "WEP",
                                                            },
                                                            {
                                                                label: "WPA-PSK",
                                                                value: "WPA-PSK",
                                                            },
                                                            {
                                                                label: "WPA-WPA2-PSK",
                                                                value: "WPA-WPA2-PSK",
                                                            },
                                                            {
                                                                label: "WPA2-ENTERPRISE",
                                                                value: "WPA2-ENTERPRISE",
                                                            },
                                                            {
                                                                label: "WPA2-PSK",
                                                                value: "WPA2-PSK",
                                                            },
                                                        ]}
                                                    />
                                                </div>
                                            </div>

                                            <div className="columns">
                                                <div className="column col-3 col-lg-3 col-md-4 col-sm-4 my-2">{T("S321")}:</div>
                                                <div className="column col-9 col-lg-9 col-md-8 col-sm-8">
                                                    <Select
                                                        id="ipMode_sta"
                                                        value={stationIpMode}
                                                        setValue={handleStationIpModeChange}
                                                        disabled={isSaving}
                                                        options={[
                                                            { label: T("S330"), value: "DHCP" },
                                                            { label: T("S331"), value: "Static" },
                                                        ]}
                                                    />
                                                </div>
                                            </div>

                                            {/* Static IP Settings */}
                                            {stationIpMode === "Static" && (
                                                <div className="form-group">
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            flexWrap: "wrap",
                                                            gap: "1rem",
                                                            alignItems: "flex-start",
                                                        }}>
                                                        <div
                                                            style={{
                                                                flex: "1 1 auto",
                                                                minWidth: "200px",
                                                            }}>
                                                            <label class="form-label">{T("S319")}</label>
                                                            <Input
                                                                id="ip_sta"
                                                                type="text"
                                                                value={stationIP}
                                                                setValue={handleStationIPChange}
                                                                disabled={isSaving}
                                                            />
                                                        </div>

                                                        <div
                                                            style={{
                                                                flex: "1 1 auto",
                                                                minWidth: "200px",
                                                            }}>
                                                            <label class="form-label">{T("S325")}</label>
                                                            <Input
                                                                id="gateway_sta"
                                                                type="text"
                                                                value={stationGateway}
                                                                setValue={handleStationGatewayChange}
                                                                disabled={isSaving}
                                                            />
                                                        </div>

                                                        <div
                                                            style={{
                                                                flex: "1 1 100%",
                                                                minWidth: "200px",
                                                            }}>
                                                            <label class="form-label"><b>{T("S324")}
                                                            </b></label>
                                                            <Input
                                                                id="netmask_sta"
                                                                type="text"
                                                                value={stationNetmask}
                                                                setValue={handleStationNetmaskChange}
                                                                disabled={isSaving}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </Fragment>
                                    )}

                                    {/* Access Point Settings */}
                                    {(wifiMode === "STA>AP" || wifiMode === "AP") && (
                                        <Fragment>
                                            <h4 style={{ marginTop: "24px" }}>{T("S314")}</h4>

                                            {/* AP SSID and Password */}
                                            <div className="columns">
                                                <div className="column col-3 col-lg-3 col-md-4 col-sm-4 my-2">{T("S315")}:</div>
                                                <div className="column col-9 col-lg-9 col-md-8 col-sm-8">
                                                    <Input
                                                        id="ssid_ap"
                                                        type="text"
                                                        value={apSSID}
                                                        setValue={handleApSSIDChange}
                                                        disabled={isSaving}
                                                    />
                                                </div>
                                            </div>

                                            <div className="columns">
                                                <div className="column col-3 col-lg-3 col-md-4 col-sm-4 my-2">{T("S316")}:</div>
                                                <div className="column col-9 col-lg-9 col-md-8 col-sm-8">
                                                    <Input
                                                        id="password_ap"
                                                        type="password"
                                                        value={apPassword}
                                                        setValue={handleApPasswordChange}
                                                        disabled={isSaving}
                                                        style={{
                                                            border: apPasswordError ? "1px solid var(--ms-error)" : undefined
                                                        }}
                                                    />
                                                    {apPasswordError && (
                                                        <div style={{ color: "var(--ms-error)", fontSize: "12px", marginTop: "4px" }}>
                                                            {apPasswordError}
                                                        </div>
                                                    )}
                                                    {!apPassword && (wifiMode === "AP" || wifiMode === "STA>AP") && (
                                                        <div
                                                            style={{
                                                                color: "var(--ms-warning)",
                                                                fontSize: "12px",
                                                                marginTop: "4px",
                                                                opacity: 0.9,
                                                                borderLeft: "2px solid var(--ms-warning)",
                                                                paddingLeft: "6px",
                                                            }}
                                                        >
                                                            Si deja este campo vacío, se mantendrá la contraseña anterior
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* AP Country and Channel */}
                                            <div className="columns">
                                                <div className="column col-3 col-lg-3 col-md-4 col-sm-4 my-2">{T("S317")}:</div>
                                                <div className="column col-9 col-lg-9 col-md-8 col-sm-8">
                                                    <Select
                                                        id="country_ap"
                                                        value={apCountry}
                                                        setValue={handleApCountryChange}
                                                        disabled={isSaving}
                                                        options={[
                                                            {
                                                                label: "01",
                                                                value: "01",
                                                            },
                                                            {
                                                                label: "AT",
                                                                value: "AT",
                                                            },
                                                            {
                                                                label: "AU",
                                                                value: "AU",
                                                            },
                                                            {
                                                                label: "BE",
                                                                value: "BE",
                                                            },
                                                            {
                                                                label: "BG",
                                                                value: "BG",
                                                            },
                                                            {
                                                                label: "BR",
                                                                value: "BR",
                                                            },
                                                            {
                                                                label: "CA",
                                                                value: "CA",
                                                            },
                                                            {
                                                                label: "CH",
                                                                value: "CH",
                                                            },
                                                            {
                                                                label: "CN",
                                                                value: "CN",
                                                            },
                                                            {
                                                                label: "CY",
                                                                value: "CY",
                                                            },
                                                            {
                                                                label: "CZ",
                                                                value: "CZ",
                                                            },
                                                            {
                                                                label: "DE",
                                                                value: "DE",
                                                            },
                                                            {
                                                                label: "DK",
                                                                value: "DK",
                                                            },
                                                            {
                                                                label: "EE",
                                                                value: "EE",
                                                            },
                                                            {
                                                                label: "ES",
                                                                value: "ES",
                                                            },
                                                            {
                                                                label: "FI",
                                                                value: "FI",
                                                            },
                                                            {
                                                                label: "FR",
                                                                value: "FR",
                                                            },
                                                            {
                                                                label: "GB",
                                                                value: "GB",
                                                            },
                                                            {
                                                                label: "GR",
                                                                value: "GR",
                                                            },
                                                            {
                                                                label: "HK",
                                                                value: "HK",
                                                            },
                                                            {
                                                                label: "HR",
                                                                value: "HR",
                                                            },
                                                            {
                                                                label: "HU",
                                                                value: "HU",
                                                            },
                                                            {
                                                                label: "IE",
                                                                value: "IE",
                                                            },
                                                            {
                                                                label: "IN",
                                                                value: "IN",
                                                            },
                                                            {
                                                                label: "IS",
                                                                value: "IS",
                                                            },
                                                            {
                                                                label: "IT",
                                                                value: "IT",
                                                            },
                                                            {
                                                                label: "JP",
                                                                value: "JP",
                                                            },
                                                            {
                                                                label: "KR",
                                                                value: "KR",
                                                            },
                                                            {
                                                                label: "LI",
                                                                value: "LI",
                                                            },
                                                            {
                                                                label: "LT",
                                                                value: "LT",
                                                            },
                                                            {
                                                                label: "LU",
                                                                value: "LU",
                                                            },
                                                            {
                                                                label: "LV",
                                                                value: "LV",
                                                            },
                                                            {
                                                                label: "MT",
                                                                value: "MT",
                                                            },
                                                            {
                                                                label: "MX",
                                                                value: "MX",
                                                            },
                                                            {
                                                                label: "NL",
                                                                value: "NL",
                                                            },
                                                            {
                                                                label: "NO",
                                                                value: "NO",
                                                            },
                                                            {
                                                                label: "NZ",
                                                                value: "NZ",
                                                            },
                                                            {
                                                                label: "PL",
                                                                value: "PL",
                                                            },
                                                            {
                                                                label: "PT",
                                                                value: "PT",
                                                            },
                                                            {
                                                                label: "RO",
                                                                value: "RO",
                                                            },
                                                            {
                                                                label: "SE",
                                                                value: "SE",
                                                            },
                                                            {
                                                                label: "SI",
                                                                value: "SI",
                                                            },
                                                            {
                                                                label: "SK",
                                                                value: "SK",
                                                            },
                                                            {
                                                                label: "TW",
                                                                value: "TW",
                                                            },
                                                            {
                                                                label: "US",
                                                                value: "US",
                                                            },
                                                        ]}
                                                    />
                                                </div>
                                            </div>

                                            <div className="columns">
                                                <div className="column col-3 col-lg-3 col-md-4 col-sm-4 my-2">{T("S318")}:</div>
                                                <div className="column col-9 col-lg-9 col-md-8 col-sm-8">
                                                    <Input
                                                        id="channel_ap"
                                                        type="text"
                                                        value={apChannel}
                                                        setValue={handleApChannelChange}
                                                        disabled={isSaving}
                                                    />
                                                </div>
                                            </div>

                                            {/* AP IP */}
                                            <div className="columns">
                                                <div className="column col-3 col-lg-3 col-md-4 col-sm-4 my-2">{T("S319")}:</div>
                                                <div className="column col-9 col-lg-9 col-md-8 col-sm-8">
                                                    <Input
                                                        id="ip_ap"
                                                        type="text"
                                                        value={apIP}
                                                        setValue={handleApIPChange}
                                                        disabled={isSaving}
                                                    />
                                                </div>
                                            </div>
                                        </Fragment>
                                    )}

                                    {/* Action Buttons */}
                                    <div style="text-align: right; margin-top: 24px; padding: 16px 0;">

                                    </div>
                                </div>
                            </div>
                        </div>
                    </Fragment>
                )}
            </div>
            <div style="text-align: center">
                {hasChanges && (
                    <ButtonImg
                        m2
                        tooltip
                        data-tooltip={T("S62")}
                        label={T("S61")}
                        icon={<Save />}
                        disabled={isSaving || !!apPasswordError || !!staPasswordError}
                        onClick={(e: TargetedMouseEvent<HTMLButtonElement>) => {
                            useUiContextFn.haptic()
                            e.currentTarget.blur()
                            handleSaveWithConfirmation()
                        }}
                    />
                )}
            </div>
        </Fragment>
    )
}

export { WifiTab }
