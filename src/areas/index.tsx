/*
 index.tsx - ESP3D WebUI areas file

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
import { FunctionalComponent } from "preact"
import { useEffect } from "preact/hooks"
import { useModalsContext } from "../contexts/ModalsContext"
import { useToastsContext } from "../contexts/ToastsContext"
import {
    useSettingsContext,
} from "../contexts/SettingsContext"
import { useSettings, useHttpQueue, useTargetCommands } from "../hooks"
import { ViewContainer } from "./ViewContainer"
import { useExtensionBridge } from "./extensionBridge"

/*
 * Local const
 *
 */

const ContentContainer: FunctionalComponent = () => {
    const { getConnectionSettings, getInterfaceSettings } = useSettings()
    const { connectionSettings, interfaceSettings, featuresSettings } =
        useSettingsContext()
    const { createNewRequest } = useHttpQueue()
    const { targetCommands } = useTargetCommands()
    const { toasts } = useToastsContext()
    const { modals } = useModalsContext()

    useExtensionBridge({
        createNewRequest,
        targetCommands,
        toasts,
        modals,
        interfaceSettings,
        connectionSettings,
        featuresSettings,
    })

    useEffect(() => {
        getConnectionSettings(getInterfaceSettings)
        // Mount-only bootstrap: getConnectionSettings/getInterfaceSettings are
        // recreated (non-memoized) on every render; adding them here would
        // re-fetch settings on every unrelated re-render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return <ViewContainer />
}

export { ContentContainer }
