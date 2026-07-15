/*
 connection.tsx - ESP3D WebUI area file

 Copyright (c) 2020 Luc Lebosse. All rights reserved.

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
import { FunctionalComponent, TargetedMouseEvent } from "preact"
import { useRef, useEffect } from "preact/hooks"
import { useUiContext, useSettingsContext, useUiContextFn } from "../contexts"
import { Loading } from "../components/Controls"
import {
    Frown,
    AlertTriangle,
} from "preact-feather"
import { T } from "../components/Translations"
import { espHttpURL } from "../components/Helpers"
import { restartdelay } from "../targets"
import { Name } from "../targets"
import { DeepMoveIcon } from "../targets/CNC/FluidNC/icons"



/*
 * Local const
 *
 */




const ConnectionContainer: FunctionalComponent = () => {
    const { connection } = useUiContext()
    const { connectionSettings } = useSettingsContext()
    const timerCtrl = useRef<HTMLSpanElement>(null)

    const previousPageRef = useRef<string | null>(null)

    useEffect(() => {
        const currentPage = connection.connectionState.page

        if (previousPageRef.current !== currentPage) {

            switch (currentPage) {
                case "error":
                case "connectionlost":
                case "sessiontimeout":
                    useUiContextFn.beepError()
                    break

                case "already connected":
                    useUiContextFn.beep()
                    break
            }

            previousPageRef.current = currentPage
        }

    }, [connection.connectionState.page])


    let contentIcon: any
    let contentSubtitle: any
    let contentTitle: string | undefined
    let contentAction: any
    let intervalTimer = 0


    if (
        !connection.connectionState.connected ||
        connection.connectionState.updating
    ) {
        const refreshTimer = () => {
            if (intervalTimer > 0) {
                intervalTimer--
                if (timerCtrl.current) timerCtrl.current.innerHTML = intervalTimer.toString()
                setTimeout(refreshTimer, 1000)
            }
        }
        const onclick = (_e: TargetedMouseEvent<HTMLButtonElement>): void => {
            useUiContextFn.haptic()
            connection.setConnectionState({
                connected: false,
                page: "connecting",
            })
            window.location.href = espHttpURL().toString()
        }
        console.log("Rendering connection state:", connection.connectionState.page)
        switch (connection.connectionState.page) {
            //No connection
            case "error":

                contentTitle = T("S1") //"Connection error"
                contentIcon = <Frown style={{ width: "50px", height: "50px" }} />
                contentSubtitle = T("S5") //"Cannot connect with board"
                if (connection.connectionState.extraMsg)
                    contentSubtitle +=
                        `: ${connection.connectionState.extraMsg}`
                document.title =
                    `${connectionSettings.current &&
                        connectionSettings.current.HostName
                        ? connectionSettings.current.HostName
                        : Name
                    }(${T("S22")
                    })`
                contentAction = (
                    <button class="btn" onClick={onclick}>
                        {T("S8")}
                    </button>
                )
                break
            //Session timeout
            case "sessiontimeout":
            //Error connection lost
            case "connectionlost":

                contentTitle = T("S1") //"Connection error"
                contentIcon = <AlertTriangle style={{ width: "50px", height: "50px" }} />
                contentSubtitle =
                    connection.connectionState.page == "connectionlost"
                        ? T("S10")
                        : T("S173") //"Connection with board is lost"
                document.title =
                    `${connectionSettings.current &&
                        connectionSettings.current.HostName
                        ? connectionSettings.current.HostName
                        : Name
                    }(${T("S9")
                    })`
                contentAction = (
                    <button class="btn" onClick={onclick}>
                        {T("S11")}
                    </button>
                )
                break
            //Disconnected
            case "already connected":
                useUiContextFn.beep()
                contentTitle = T("S9")
contentIcon = (
    <div
        style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            opacity: 0.95,
            color: "hsl(205, 90%, 52%)",
            filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.4))"
        }}
    >
        <DeepMoveIcon height="80px" />
    </div>
)
                contentSubtitle = T("S3")
                document.title =
                    `${connectionSettings.current &&
                        connectionSettings.current.HostName
                        ? connectionSettings.current.HostName
                        : Name
                    }(${T("S9")
                    })`
                contentAction = (
                    <button class="btn" onClick={onclick}>
                        {T("S11")}
                    </button>
                )
                break
            //restart
            case "restart":
                intervalTimer = restartdelay
                setTimeout(refreshTimer, 1000)
                document.title =
                    `${connectionSettings.current &&
                        connectionSettings.current.HostName
                        ? connectionSettings.current.HostName
                        : Name
                    }(${T("S35")
                    })`
                contentTitle = T("S35") //"restarting";
                contentIcon = (
                    <div class="d-inline-block content-icon">
                        <Loading large />
                    </div>
                )
                contentSubtitle = (
                    <span>
                        {T("S60")}
                        <span ref={timerCtrl}>{restartdelay}</span>
                        {T("S119")}
                    </span>
                )
                contentAction = ""
                break
            default: //"Please wait..."
                if (connection.connectionState.updating) {
                    contentTitle = T("S35") //"restarting";
                    connection.setConnectionState({
                        connected: connection.connectionState.connected,
                        page: connection.connectionState.page,
                        updating: false,
                    })
                } else {
                    document.title =
                        `${connectionSettings.current &&
                            connectionSettings.current.HostName
                            ? connectionSettings.current.HostName
                            : Name
                        }(${T("S2")
                        })`
                    contentTitle = T("S2") //"Connecting";
                }
                contentIcon = (
                    <div class="d-inline-block content-icon">
                        <Loading large />
                    </div>
                )
                contentSubtitle = T("S60")
                contentAction = ""
        }
        return (
            <div class="empty fullscreen">
                <div class="centered text-primary">
                    <div class="empty-icon">
                        <div class="d-flex p-centered empty-content">

                            {contentIcon}

                        </div>
                    </div>
                    <div class="empty-title h5">{contentTitle}</div>
                    <div class="empty-subtitle">{contentSubtitle}</div>
                    <div class="empty-action">{contentAction}</div>
                </div>
            </div>
        )
    }

    return null;
}

export { ConnectionContainer }
