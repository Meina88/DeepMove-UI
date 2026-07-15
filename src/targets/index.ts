/*
 index.ts - ESP3D WebUI Target file (CNC/FluidNC)

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
import {
    MachineSettings,
    machineSettings,
    defaultPanelsList,
    Target,
    files,
    processor,
    fwUrl,
    Name,
    iconsTarget,
    restartdelay,
    TargetContextProvider,
    useTargetContext,
    useTargetContextFn,
    webUIbuild,
    variablesList,
    eventsList,
    AppLogo,
    WebUILogo,
    QuickButtonsBar,
    BackgroundContainer,
} from "./CNC/FluidNC"

// DeepMove is hardcoded to a single target/subtarget (CNC/FluidNC), so
// preferences.json lives directly here rather than being assembled from
// separate base/target/subtarget layers at runtime (see mergeJSON's removal
// in src/components/Helpers/arrays.ts).
import defaultPreferences from "./CNC/FluidNC/preferences.json"

const webUiUrl = "https://github.com/Meina88/DeepMove-UI"

export {
    MachineSettings,
    machineSettings,
    Target,
    defaultPreferences,
    files,
    processor,
    defaultPanelsList,
    fwUrl,
    webUiUrl,
    Name,
    iconsTarget,
    restartdelay,
    TargetContextProvider,
    useTargetContext,
    useTargetContextFn,
    webUIbuild,
    variablesList,
    eventsList,
    AppLogo,
    WebUILogo,
    QuickButtonsBar,
    BackgroundContainer,
}
