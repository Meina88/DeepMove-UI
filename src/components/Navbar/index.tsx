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
import { Fragment, ComponentChildren, TargetedMouseEvent } from "preact"
import { useState, useEffect, useRef } from "preact/hooks"
import { iconsFeather, } from "../Images"
import { iconsTarget, AppLogo, } from "../../targets"
import { useTargetContext } from "../../targets"
import { Link } from "../Router"
import { T } from "../Translations"
import {
    useSettingsContext,
    useUiContext,
    useModalsContext,
    useUiContextFn,
} from "../../contexts"
import { useWebSocketService } from "../../hooks/useWebSocketService";
import { useHttpQueue } from "../../hooks"
import { espHttpURL } from "../Helpers"
import { showConfirmationModal } from "../Modal"
import {
    Server,
    Settings,
    LogOut,
    Trello,
    ChevronDown,
    Smartphone,
    Maximize,
    Minimize,
    RefreshCw,
    Power,
    Monitor,
} from "preact-feather"
import { useTargetCommands } from "../../hooks"
import { DashboardIcon } from "../../targets/CNC/FluidNC/icons"
import { eventBus } from "../../hooks/eventBus"





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

const defaultLinks: NavLinkItem[] = [
    {
        label: "",
        icon: <AppLogo bgcolor="#ffffff" />,
        href: "/dashboard",
    },
    {
        label: "S14",
        icon: <Settings />,
        href: "/settings",
        id: "settingsLink",
    },
]

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





const Navbar = () => {
    const lastValidState = useRef<string>("Offline");
    const [isSettingsPage, setIsSettingsPage] = useState(
        window.location.hash.startsWith("#/settings")
    )

    const { connectionSettings } = useSettingsContext()
    const { uisettings } = useUiContext()
    const { modals } = useModalsContext()
    const { createNewRequest } = useHttpQueue()
    const { targetCommands } = useTargetCommands()
    const webSocketService = useWebSocketService();
    const buttonExtraPage = useRef<HTMLAnchorElement | null>(null)
    const menuExtraPage = useRef<HTMLUListElement | null>(null)
    const iconsList: Record<string, any> = { ...iconsTarget, ...iconsFeather }
    const [textbutton, setTextButton] = useState<ComponentChildren>(
        <Fragment>
            <Trello />
            <label class="hide-low">{T("S155")}</label>
        </Fragment>
    )
    const [hrefbutton, setHrefButton] = useState<string | undefined>(undefined)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [isTabletDevice, setIsTabletDevice] = useState(isTablet())

    const reloadPage = () => {
        useUiContextFn.haptic()
        window.location.reload()
    }

    const { status } = useTargetContext() as unknown as {
        status: { state?: string }
    }
    const isIdle = status?.state === "Idle"



    /*
    auto-scroll textarea into view if mobile keyboard is blocking textarea to prevent
    page resize and navbar from snapping out of viewport due to using fixed heights
    */
    window.visualViewport?.addEventListener("resize", () => {
        window.scrollTo(0, 0);
    });


    const disconnectNow = () => {
        const formData = new FormData()
        formData.append("DISCONNECT", "YES")
        createNewRequest(
            espHttpURL("login"),
            { method: "POST", id: "login", body: formData },
            {
                onSuccess: (_result: string) => {
                    webSocketService.disconnect("sessiontimeout")
                },
                onFail: (_error: string) => {
                    webSocketService.disconnect("sessiontimeout")
                },
            }
        )
    }
    const menuLinks: NavLinkItem[] = []
    const rawState = status?.state;

    if (rawState && rawState !== "?") {
        lastValidState.current = rawState;
    }

    const effectiveState =
        !rawState || rawState === "?"
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

    const onDisconnect = () => {
        useUiContextFn.haptic()
        showConfirmationModal({
            modals,
            title: T("S26"),
            content: T("S152"),
            button1: { cb: disconnectNow, text: T("S27") },
            button2: { text: T("S28") },
        })
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
        const updateTabletState = () => {
            setIsTabletDevice(isTablet())
        }

        window.addEventListener("resize", updateTabletState)
        window.addEventListener("orientationchange", updateTabletState)

        return () => {
            window.removeEventListener("resize", updateTabletState)
            window.removeEventListener("orientationchange", updateTabletState)
        }
    }, [])

    if (uisettings.current) {
        return (
            <header class="navbar navbar-centered">

                {/* IZQUIERDA */}
                <section class="navbar-section navbar-left">

                    {/* ⏻ Power Off */}
                    <span
                        className={`btn btn-link no-box feather-icon-container text-error ${!isIdle ? "disabled opacity-50" : ""
                            }`}
                        onClick={isIdle ? onPowerOff : undefined}
                    >
                        <Power />
                    </span>

                    {/* 🔄 Refresh */}
                    <span
                        className="btn btn-link no-box feather-icon-container"
                        onClick={reloadPage}
                    >
                        <RefreshCw />
                    </span>

                    {/* ● Estado CNC (TERCER CASILLERO) */}
                    <div
                        class={`cnc-status-led ${effectiveState
                            ? `state-${effectiveState.toLowerCase()}`
                            : "state-offline"
                            }`}
                        title={effectiveState || "Offline"}

                    />


                </section>

                {/* CENTRO */}
                <section class="navbar-section navbar-center">
                    <div className="navbar-brand logo no-box">
                        <AppLogo />
                    </div>
                </section>


                {/* DERECHA */}
                <section class="navbar-section navbar-right">

                    {/* Tablet Switch */}


                    {/* 🖥 HMI Fullscreen */}
                    {isTabletDevice && (
                        <button
                            class="hmi-launch-btn"
                            onClick={toggleHMI}
                            title="Open HMI Console"
                        >
                            <Monitor size={16} />
                            <span>HMI</span>
                        </button>
                    )}






                    {/* ⛶ Fullscreen */}
                    {!isIOS() && (
                        <span
                            className="btn btn-link no-box feather-icon-container"
                            onClick={toggleFullscreen}
                        >
                            {isFullscreen ? <Minimize /> : <Maximize />}
                        </span>
                    )}

                    {/* ⚙ Settings */}
                    <span
                        className="btn btn-link no-box feather-icon-container"
                        onClick={toggleSettingsDashboard}
                        title={isSettingsPage ? "Volver al Dashboard" : "Settings"}
                    >
                        {isSettingsPage ? <DashboardIcon /> : <Settings />}
                    </span>


                </section>

            </header>

        )
    }
    return null
}

export { Navbar }
