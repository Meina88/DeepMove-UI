/*
 index.js - ESP3D WebUI App file

 Copyright (c) 2020 Luc Lebosse. All rights reserved.
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
import {
    RouterContextProvider,
    HttpQueueContextProvider,
    UiContextProvider,
    SettingsContextProvider,
    DatasContextProvider,
    ToastsContextProvider,
    ModalsContextProvider,
} from "../../contexts"
import { TargetContextProvider } from "../../targets"
import { ContainerHelper } from "../Controls"
import { ContentContainer } from "../../areas"
import { ElementsCache } from "../../areas/elementsCache"
import { ConnectionManager } from "../ConnectionManager"
import { useState, useEffect } from "preact/hooks"
import { Splash } from "./Splash"

import SafetyDisclaimerModal from "../Modal/SafetyDisclaimerModal"
import { useStoredState } from "../Helpers/storedState"


const App = () => {
    const [loading, setLoading] = useState(true)
    const DISCLAIMER_VERSION = "1.0.0"

    const [acceptedDisclaimer, setAcceptedDisclaimer] = useStoredState<string | null>(
        "deepmove_disclaimer_version",
        null
    )

    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false)
        }, 1500)

        return () => clearTimeout(timer)
    }, [])

    const showDisclaimer =
        !loading && acceptedDisclaimer !== DISCLAIMER_VERSION

    return (
        <div id="app">
            <DatasContextProvider>
                <TargetContextProvider>
                    <RouterContextProvider>
                        <UiContextProvider>
                            <HttpQueueContextProvider>
                                <SettingsContextProvider>
                                    <ToastsContextProvider>
                                        <ModalsContextProvider>
                                            {loading && <Splash />}
                                            <SafetyDisclaimerModal
                                                visible={showDisclaimer}
                                                onAccept={() => setAcceptedDisclaimer(DISCLAIMER_VERSION)}
                                            />

                                            <ConnectionManager />
                                            <ContainerHelper id="top_container" active={true} />
                                            <ElementsCache />
                                            <ContentContainer />
                                        </ModalsContextProvider>
                                    </ToastsContextProvider>
                                </SettingsContextProvider>
                            </HttpQueueContextProvider>
                        </UiContextProvider>
                    </RouterContextProvider>
                </TargetContextProvider>
            </DatasContextProvider>
        </div>
    )
}
export { App }
