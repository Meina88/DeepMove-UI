/*
ContainerHelper.tsx - ESP3D WebUI component file

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

import { Fragment,  FunctionalComponent } from "preact"
import { ModalContainer } from "../Modal"
import { ToastsContainer } from "../Toast"
import { useState, useEffect, useRef } from "preact/hooks"
import { eventBus } from "../../hooks/eventBus"

interface ContainerHelperProps {
    id: string
    active?: boolean
}

interface UpdateStateMessage {
    isFullScreen?: boolean
    id?: string
}

const ContainerHelper: FunctionalComponent<ContainerHelperProps> = ({ id, active = false }) => {
    const [enabled, setEnabled] = useState(active)
    // Unique per mounted instance: eventBus.on()/off() key subscriptions by a plain id, and off()
    // removes whatever is currently registered under that id regardless of who put it there. Every
    // panel mounts a ContainerHelper with the same `id` prop (e.g. "filesPanel") both in the dashboard
    // and embedded in HMI, so the fixed `listener_containerhelper_${id}` here let one instance's mount
    // silently steal the other's listener slot, and the off() below was commented out so it was never
    // released either - leaving whichever instance survived a mount/unmount transition (e.g. entering
    // HMI) without a working listener. Same bug class already fixed in useToolpathFileEvents.ts
    // (commit 58491c55); scoping the id per instance and actually calling off() on unmount makes
    // on()/off() only ever touch this instance's own registration.
    const instanceId = useRef(`listener_containerhelper_${id}-${Math.random().toString(36).slice(2)}`)

    useEffect(() => {
        const handleUpdateState = (msg: UpdateStateMessage) => {
            if ('isFullScreen' in msg) {
                if (msg.isFullScreen) {
                    if (id == msg.id) {
                        setEnabled(true)
                    } else {
                        setEnabled(false)
                    }
                } else {
                    if (id === "top_container") {
                        setEnabled(true)
                    } else {
                        setEnabled(false)
                    }
                }
            }
        }
        const listenerId = eventBus.on("updateState", handleUpdateState, instanceId.current)
        return () => {
            eventBus.off("updateState", listenerId)
        }
    }, [id])

    if (enabled) return (
        <Fragment>
            <ModalContainer />
            <ToastsContainer />
        </Fragment>
    )
    return null
}
export default ContainerHelper
