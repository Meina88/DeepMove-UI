/*
 BackgroundContainer.tsx - ESP3D WebUI Target file

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
import { useEffect } from "preact/hooks"
import { useTargetContext } from "../../.."
import { useToastsContext } from "../../../../contexts"
import { T } from "../../../../components/Translations"
import { useTargetCommands } from "../../../../hooks"
import type { Status } from "../../../types"

const last: { status: Status } = { status: { state: "?" } }

const BackgroundContainer = () => {
    const { alarmCode, errorCode, status } = useTargetContext()
    const { toasts } = useToastsContext()
    const { targetCommands } = useTargetCommands()

    useEffect(() => {
        if (status.state !== last.status.state) {
            if (status.state == "Tool") {
                targetCommands("#TOOLCHANGE#")
            }
            last.status = status
        }
        if (alarmCode != 0 || errorCode != 0) {
            toasts.addToast({
                type: "error",
                content: T(
                    alarmCode != 0 ? `ALARM:${  alarmCode}` : `error:${  errorCode}`
                ),
            })
        }
        // targetCommands/toasts are recreated every render; adding them here would re-fire this
        // effect (and re-post the alarm/error toast) on every unrelated re-render while an
        // alarm/error is active, spamming duplicate notifications.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [alarmCode, errorCode, status])

    return null
}

export { BackgroundContainer }
