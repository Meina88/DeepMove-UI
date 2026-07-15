/*
 Navbar.js - ESP3D WebUI navigation bar file


 Copyright (c) 2021 Luc Lebosse. All rights reserved.
 Original code inspiration : 2021 Alexandre Aussourd

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
import { useState, useEffect, useRef } from "preact/hooks"
import { iconsFeather, } from "../Images"
import { iconsTarget, AppLogo, } from "../../targets"
import { useTargetContext } from "../../targets"
import { T } from "../Translations"
import {
    useUiContext,
    useModalsContext,
    useUiContextFn,
} from "../../contexts"
import { showConfirmationModal } from "../Modal"
import {
    Settings,
    Maximize,
    Minimize,
    Power,
    Monitor,
    RotateCw,
    Menu,
} from "preact-feather"
import { useTargetCommands } from "../../hooks"
import { DashboardIcon } from "../../targets/CNC/FluidNC/icons"
import { DeepMoveIcon } from "../../targets/CNC/FluidNC/icons"
import { eventBus } from "../../hooks/eventBus"
import { Flare } from "../../targets/CNC/FluidNC/icons"






/*
 * Local const
 *
 */
interface NavLinkItem {
    label: any
    icon: any
    href: string
    id?: string
}

// Utility to detect iOS/iPadOS
function isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.userAgent.includes("Macintosh") && "ontouchend" in document)
}

function isTablet(): boolean {
    const hasTouch = navigator.maxTouchPoints > 0

    // screen.* no cambia con la barra del navegador (clave para landscape sin fullscreen)
    const shortSide = Math.min(window.screen.width, window.screen.height)

    // 600 es un umbral razonable para tablets (short side en CSS px)
    return hasTouch && shortSide >= 600
}

function isMobile(): boolean {
    const hasTouch = navigator.maxTouchPoints > 0
    const shortSide = Math.min(window.screen.width, window.screen.height)
    return hasTouch && shortSide < 600
}



const Navbar = () => {
    const [currentTool, setCurrentTool] = useState<number | null>(null)
    const lastValidState = useRef<string>("Offline");
    const [isSettingsPage, setIsSettingsPage] = useState(
        window.location.hash.startsWith("#/settings")
    )

    const { uisettings } = useUiContext()
    const { toolNumbers, setToolNumbers } = useUiContext()

    const laserModeEnabled = uisettings?.getValue?.("lasermode") ?? true

    const { parserstate } = useTargetContext() as any

    const { modals } = useModalsContext()
    const { targetCommands } = useTargetCommands()
    const menuRef = useRef<HTMLDivElement | null>(null)
    const iconsList: Record<string, any> = { ...iconsTarget, ...iconsFeather }
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)
    const [isTabletDevice, setIsTabletDevice] = useState(isTablet())
    const [_isMobileDevice, setIsMobileDevice] = useState(isMobile())
    const [_cpuTemp, setCpuTemp] = useState<string | null>(null)
    const [pendingTool, setPendingTool] = useState<number | null>(null)
    const toolChangeTimer = useRef<number | null>(null)

    const reloadPage = () => {
        useUiContextFn.haptic()
        window.location.reload()
    }

    const toggleMenu = () => {
        useUiContextFn.haptic()
        setMenuOpen((prev) => !prev)
    }

    const { status } = useTargetContext() as unknown as {
        status: { state?: string }
    }
    const isIdle = status?.state === "Idle"

    const menuLinks: NavLinkItem[] = []
    const rawState = status?.state;

    if (rawState && rawState !== "?") {
        lastValidState.current = rawState;
    }

    const effectiveState =
        (!rawState || rawState === "?")
            ? lastValidState.current
            : rawState;

    if (uisettings.current) {
        if (uisettings.getValue("showextracontents")) {
            const extraContents = uisettings.getValue("extracontents")

            const extraPages = extraContents.reduce((acc: NavLinkItem[], curr: any) => {
                const item = curr.value.reduce((accumulator: any, current: any) => {
                    accumulator[current.name] = current.initial
                    return accumulator
                }, {})

                if (item.target == "page") {
                    const pageIcon = iconsList[item.icon]
                        ? iconsList[item.icon]
                        : ""
                    acc.push({
                        label: item.name,
                        icon: pageIcon,
                        href: `/#/extrapage/${curr.id}`,
                        id: curr.id,
                    })
                }

                return acc
            }, [])
            menuLinks.push(...extraPages)
        }
    }

    const powerOffNow = () => {
        useUiContextFn.haptic()
        targetCommands("M62 P0")
    }



    const onPowerOff = () => {
        useUiContextFn.haptic()
        showConfirmationModal({
            modals,
            title: T("S246"),
            content: T("S247"),
            button1: {
                cb: powerOffNow,
                text: T("S248"),
            },
            button2: {
                text: T("S28"),
            },
        })
    }


    const toggleHMI = () => {
        useUiContextFn.haptic()

        // Emitimos evento al HMI
        eventBus.emit("hmi:toggleFullscreen", null)

    }


    const toggleFullscreen = () => {
        useUiContextFn.haptic()
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                setIsFullscreen(true)
            }).catch(err => {
                console.log(`Error attempting to enable fullscreen: ${err.message}`)
            })
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().then(() => {
                    setIsFullscreen(false)
                })
            }
        }


    }




    const toggleSettingsDashboard = () => {
        useUiContextFn.haptic()

        if (isSettingsPage) {
            window.location.hash = "#/dashboard"
        } else {
            window.location.hash = "#/settings"
        }
    }

    const toggleToolMode = () => {
        useUiContextFn.haptic(30)
        useUiContextFn.click()

        if (!isIdle) return
        if (toolNumbers.vfd == null) return

        // Si el usuario intenta cambiar a Laser pero no está configurado
        if (toolNumbers.laser == null) {
            showConfirmationModal({
                modals,
                title: T("S338"),
                content: T("S339"),
                button1: { text: "OK" },
            })
            return
        }

        if (currentTool == null) return
        if (pendingTool != null) return // evita doble click

        const nextTool =
            currentTool === toolNumbers.vfd
                ? toolNumbers.laser
                : toolNumbers.vfd

        setPendingTool(nextTool)

        let cleanupDone = false

        const cleanup = (success: boolean) => {

            if (cleanupDone) return
            cleanupDone = true

            eventBus.off("fw:toolchange", onToolChange as any)
            eventBus.off("fw:gc", onGC as any)

            if (toolChangeTimer.current) {
                clearTimeout(toolChangeTimer.current)
                toolChangeTimer.current = null
            }

            if (success) {
                setCurrentTool(nextTool)

                // Si cambiamos a Laser
                if (nextTool === toolNumbers.laser) {
                    const enableM7 = uisettings?.getValue?.("laser_m7_on_enable")
                    const enableM8 = uisettings?.getValue?.("laser_m8_on_enable")

                    if (enableM7) {
                        targetCommands("M7")
                    }

                    if (enableM8) {
                        targetCommands("M8")
                    }

                    // 🔄 actualizar estado modal
                    targetCommands("$G")
                }

                // Si cambiamos a CNC apagar refrigerantes / air assist
                if (nextTool === toolNumbers.vfd) {
                    targetCommands("M9")
                    targetCommands("$G")
                }
            }

            else {
                showConfirmationModal({
                    modals,
                    title: T("S340"),
                    content: T("S341"),
                    button1: { text: "OK" },
                })
            }

            setPendingTool(null)
        }



        const onToolChange = (_line: string) => {
            cleanup(true)
        }

        const onGC = (line: string) => {
            const match = line.match(/\bT(\d+)\b/)
            if (!match) return
            const tool = parseInt(match[1], 10)
            if (tool === nextTool) {
                cleanup(true)
            }
        }

        eventBus.on("fw:toolchange", onToolChange as any)
        eventBus.on("fw:gc", onGC as any)

        // enviar comando de cambio
        // aseguramos que spindle/laser esté apagado antes del cambio
        targetCommands("M5")
        targetCommands("S0")

        // enviar comando de cambio
        setTimeout(() => {
            targetCommands(`M6 T${nextTool}`)
        }, 50)

        // fallback: pedir estado
        setTimeout(() => {
            targetCommands("$G")
        }, 200)

        // timeout de seguridad
        toolChangeTimer.current = window.setTimeout(() => {
            cleanup(false)
        }, 3000)
    }

    useEffect(() => {
        targetCommands("[ESP420]json=yes", undefined, undefined, {
            onSuccess: (result: any) => {
                try {
                    const json = JSON.parse(result)
                    if (json?.data) {
                        const cpu = json.data.find((e: any) =>
                            e.id === "CPU Temperature"
                        )
                        if (cpu) {
                            setCpuTemp(cpu.value)
                        }
                    }
                } catch (e) {
                    console.log("Error parsing ESP420", e)
                }
            }
        })
    }, [])

    useEffect(() => {
        if (toolNumbers.vfd != null && currentTool == null) {
            setCurrentTool(toolNumbers.vfd)
        }
    }, [toolNumbers.vfd])


    useEffect(() => {
        if (parserstate?.tool != null) {
            setCurrentTool(parserstate.tool)
        }
    }, [parserstate?.tool])

    useEffect(() => {
        targetCommands("[ESP400]json=yes", undefined, { echo: false }, {
            onSuccess: (result: string) => {
                try {
                    const json = JSON.parse(result)
                    if (!json?.data) return

                    let vfdTool: number | null = null
                    let laserTool: number | null = null

                    json.data.forEach((item: any) => {
                        if (item.P === "/ModbusVFD/tool_num") {
                            vfdTool = parseInt(item.V)
                        }
                        if (item.P === "/Laser/tool_num") {
                            laserTool = parseInt(item.V)
                        }
                    })

                    setToolNumbers({
                        vfd: vfdTool,
                        laser: laserTool,
                    })

                } catch (e) {
                    console.log("ESP400 parse error", e)
                }
            },
            onFail: (err: string) => {
                console.log("ESP400 failed", err)
            }
        })
    }, [])

    useEffect(() => {
        const syncToolFromGC = (line: string) => {
            const match = line.match(/\bT(\d+)\b/)
            if (!match) return

            const tool = parseInt(match[1], 10)
            setCurrentTool(tool)
        }

        const sub = eventBus.on("fw:gc", syncToolFromGC)

        return () => eventBus.off("fw:gc", sub)
    }, [])

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement)
        }
        document.addEventListener('fullscreenchange', handleFullscreenChange)
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange)
        }
    }, [])

    useEffect(() => {
        const onHashChange = () => {
            setIsSettingsPage(window.location.hash.startsWith("#/settings"))
        }

        window.addEventListener("hashchange", onHashChange)

        return () => {
            window.removeEventListener("hashchange", onHashChange)
        }
    }, [])

    useEffect(() => {
        const updateDeviceState = () => {
            setIsTabletDevice(isTablet())
            setIsMobileDevice(isMobile())
        }

        window.addEventListener("resize", updateDeviceState)
        window.addEventListener("orientationchange", updateDeviceState)

        return () => {
            window.removeEventListener("resize", updateDeviceState)
            window.removeEventListener("orientationchange", updateDeviceState)
        }
    }, [])

    useEffect(() => {

        const handleReset = () => {

            // 🔥 limpiar todo estado previo
            targetCommands("M5")
            targetCommands("S0")

            // 🔥 forzar CNC como tool activo
            if (toolNumbers?.vfd != null) {

                setTimeout(() => {
                    targetCommands(`M6 T${toolNumbers.vfd}`)
                }, 50)

                setTimeout(() => {
                    targetCommands("$G")
                }, 200)
            }
        }

        const sub = eventBus.on("fw:reset", handleReset)

        return () => eventBus.off("fw:reset", sub)

    }, [toolNumbers])

    useEffect(() => {
        if (!menuOpen) return

        const handlePointerOutside = (event: PointerEvent) => {
            const target = event.target as Node

            if (menuRef.current && !menuRef.current.contains(target)) {
                setMenuOpen(false)
            }
        }

        document.addEventListener("pointerdown", handlePointerOutside)

        return () => {
            document.removeEventListener("pointerdown", handlePointerOutside)
        }
    }, [menuOpen])

    useEffect(() => {
        const handleViewportResize = () => {
            window.scrollTo(0, 0)
        }

        window.visualViewport?.addEventListener("resize", handleViewportResize)

        return () => {
            window.visualViewport?.removeEventListener("resize", handleViewportResize)
        }
    }, [])

    if (uisettings.current) {
        return (
            <header class="navbar navbar-centered">

                {/* IZQUIERDA */}
                <section class="navbar-section navbar-left">

                    {/* ☰ Menu */}
                    <div class="navbar-menu-wrapper" ref={menuRef}>

                        <span
                            class="btn btn-link no-box feather-icon-container"
                            onPointerDown={(e: any) => {
                                e.preventDefault()
                                e.stopPropagation()
                                toggleMenu()
                            }}
                        >
                            <Menu />
                        </span>

                        {menuOpen && (
                            <div class="navbar-dropdown">

                                <div
                                    class="navbar-dropdown-item"
                                    onClick={() => {
                                        reloadPage()
                                        setMenuOpen(false)
                                    }}
                                >
                                    <RotateCw size={16} />
                                    <span>{T("S50")}</span>
                                </div>

                                <div
                                    class="navbar-dropdown-item"
                                    onClick={() => {
                                        toggleSettingsDashboard()
                                        setMenuOpen(false)
                                    }}
                                >
                                    {isSettingsPage ? <DashboardIcon height="16px" /> : <Settings size={16} />}

                                    <span>
                                        {isSettingsPage ? T("S13") : T("S14")}
                                    </span>
                                </div>

                                <div class="navbar-dropdown-separator" />

                                {laserModeEnabled && (
                                    <div
                                        class={`navbar-dropdown-item laser-mode-item ${!isIdle ? "disabled" : ""}`}
                                        onClick={() => {
                                            if (isIdle && pendingTool == null) {
                                                toggleToolMode()
                                            }
                                        }}
                                    >
                                        <span class="laser-mode-label">
                                            <Flare height="16px" />
                                            <span>{T("CN35")}</span>
                                        </span>

                                        <div class={`laser-mode-switch ${currentTool === toolNumbers.laser ? "active" : ""}`}>
                                            <div class="laser-mode-thumb"></div>
                                        </div>
                                    </div>
                                )}

                                <div
                                    class={`navbar-dropdown-item ${!isIdle ? "disabled" : ""}`}
                                    onClick={() => {
                                        if (isIdle) onPowerOff()
                                        setMenuOpen(false)
                                    }}
                                >
                                    <Power size={16} />
                                    <span>{T("S377")}</span>
                                </div>

                            </div>
                        )}
                    </div>

                    {/* ● Estado CNC */}
                    <div class="cnc-status-wrapper">
                        <div
                            class={`cnc-status-led ${effectiveState
                                ? `state-${effectiveState.toLowerCase()}`
                                : "state-offline"
                                }`}
                        />
                        <span class="cnc-status-text">
                            {effectiveState ? T(effectiveState) : "OFFLINE"}
                        </span>
                    </div>
                </section>

                {/* CENTRO */}
                <section class="navbar-section navbar-center">
                    <div className="navbar-brand logo no-box deepmove-brand">
                        <DeepMoveIcon height="1.4em" />

                        <span class="deepmove-wordmark">
                            <AppLogo />
                        </span>

                        {/* 🧪 Tool Numbers Debug */}

                        {/* <span (descomentar para visualizar los tool_num)
                            style={{
                                marginLeft: "12px",
                                fontSize: "0.75rem",
                                opacity: 0.65,
                                letterSpacing: "0.5px"
                            }}
                        >
                            VFD T{toolNumbers.vfd ?? "-"} | LASER T{toolNumbers.laser ?? "-"}
                        </span> */}

                    </div>
                </section>




                {/* DERECHA */}
                <section class="navbar-section navbar-right">
                    {/* Tablet Switch */}
                    {/* 🖥 HMI Fullscreen */}
                    {isTabletDevice && (
                        <div
                            class={`tablet-hmi-switch ${isFullscreen ? "active" : ""}`}
                            onClick={toggleHMI}
                            title="Toggle HMI"
                        >
                            <div class="switch-track">
                                <div class="switch-thumb" />
                            </div>

                            <Monitor size={20} class="switch-monitor-icon" />
                        </div>
                    )}

                    {/* ⛶ Fullscreen */}
                    {!isIOS() && (
                        <span
                            className="btn btn-link no-box feather-icon-container navbar-fullscreen-btn"
                            onClick={toggleFullscreen}
                        >
                            {isFullscreen ? <Minimize /> : <Maximize />}
                        </span>
                    )}



                </section>

            </header>

        )
    }
    return null
}

export { Navbar }
