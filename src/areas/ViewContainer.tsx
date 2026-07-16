/*
 ViewContainer.tsx - ESP3D WebUI areas file

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
import { Fragment, FunctionalComponent } from "preact"
import { Menu } from "./menu"
import { ConnectionContainer } from "./connection"
import { MainContainer } from "./main"
import { useUiContext } from "../contexts/UiContext"
import { useKeepConnectedModal } from "../components/Modal"

const ViewContainer: FunctionalComponent = () => {
    const { connection, dialogs } = useUiContext()
    useKeepConnectedModal(dialogs.showKeepConnected, dialogs.setShowKeepConnected)
    if (
        connection.connectionState.connected &&
        !connection.connectionState.updating
    )
        return (
            <Fragment>
                <Menu />
                <MainContainer />
            </Fragment>
        )
    else {
        return <ConnectionContainer />
    }
}

export { ViewContainer }
