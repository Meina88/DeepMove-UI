/*
 keepConnectedModal.tsx - ESP3D WebUI component file

 Copyright (c) 2021 Luc LEBOSSE. All rights reserved.

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
import { TargetedMouseEvent } from "preact"
import { useEffect } from "preact/hooks"
import { HelpCircle } from "preact-feather"
import { useUiContextFn, useModalsContext } from "../../contexts"
import { useHttpFn } from "../../hooks"
import { T } from "../../components/Translations"
import { espHttpURL } from "../../components/Helpers"

/*
 * Local const
 *
 */
const useKeepConnectedModal = (showKeepConnected: boolean, setShowKeepConnected: (show: boolean) => void): void => {
    const { modals } = useModalsContext()

    useEffect(() => {
        if (!showKeepConnected) return
        setShowKeepConnected(false)

        const id = "keepconnected"
        const clickKeepConnected = (_e: TargetedMouseEvent<HTMLButtonElement>): void => {
            useUiContextFn.haptic()
            useHttpFn.createNewRequest(
                espHttpURL("command", { PING: "Yes" }),
                { method: "GET" },
                {
                    onSuccess: (_result: string): void => {
                        //TODO:Need to do something ? TBD
                    },
                    onFail: (_error: string): void => {
                        //TODO:Need to do something ? TBD
                    },
                }
            )
            modals.removeModal(modals.getModalIndex(id))
        }
        const clickCancel = (_e: TargetedMouseEvent<HTMLButtonElement>): void => {
            useUiContextFn.haptic()
            modals.removeModal(modals.getModalIndex(id))
        }
        if (modals.getModalIndex(id) == -1)
            modals.addModal({
                id: id,
                title: (
                    <div class="text-primary feather-icon-container modal_title">
                        <HelpCircle />
                        <label>{T("S145")}</label>
                    </div>
                ),
                content: T("S153"),
                footer: (
                    <div>
                        <button class="btn mx-2" onClick={clickKeepConnected}>
                            {T("S27")}
                        </button>
                        <button class="btn mx-2" onClick={clickCancel}>
                            {T("S28")}
                        </button>
                    </div>
                ),
                //overlay: true,
                hideclose: false,
            })
        // intentional: only re-run when the flag flips, not on every modals/createNewRequest identity change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showKeepConnected])
}
export { useKeepConnectedModal }
