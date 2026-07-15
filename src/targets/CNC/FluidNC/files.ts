/*
 files.js - ESP3D WebUI Target file

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
import { FLASH } from "../../FLASH-source"
import { DIRECTSD } from "./DIRECTSD-source"
import { useSettingsContextFn, useUiContextFn } from "../../../contexts"
import { FileCommand, FilesModule, SupportedFileType } from "../../../types/files.types"
import { sanitizePathSegment } from "../../../components/Helpers"

// Commands with a (path, filename?) signature - the only ones that take a
// user/extension-controlled filesystem path in FLASH-source.ts/DIRECTSD-source.ts.
// formatResult/filterResult are intentionally excluded: their first argument is
// a data blob, not a path.
const PATH_COMMANDS = new Set(["list", "upload", "deletedir", "delete", "createdir", "download", "play"])

//List of supported files systems
const supportedFileSystems : SupportedFileType[] = [
    {
        value: "FLASH",
        name: "S137",
        depend: () => {
            return (
                useUiContextFn.getValue("flashfs") &&
                useSettingsContextFn.getValue("FlashFileSystem") != "none"
            )
        },
    },
    {
        value: "DIRECTSD",
        name: "S190",
        depend: () => {
            return (
                useUiContextFn.getValue("directsd") &&
                useSettingsContextFn.getValue("SDConnection") != "none"
            )
        },
    }
] as const

const capabilities: Record<string, any> = {
    FLASH: FLASH.capabilities,
    DIRECTSD: DIRECTSD.capabilities,
}

const commands: Record<string, any> = {
    FLASH: FLASH.commands,
    DIRECTSD: DIRECTSD.commands,
}

function capability(filesystem: string, capability: string, ...rest: any[]): any {
    if (!filesystem) return false
    if (capabilities[filesystem] && capabilities[filesystem][capability])
        return capabilities[filesystem][capability](...rest)
    //console.log("Unknow capability ", cap, " for ", filesystem)
    return false
}

function command(filesystem: string, cmd: string, ...rest: any[]): FileCommand {
    if (commands[filesystem] && commands[filesystem][cmd]) {
        if (PATH_COMMANDS.has(cmd)) {
            const [rawPath, rawFilename, ...others] = rest
            const path = typeof rawPath === "string" ? sanitizePathSegment(rawPath) : rawPath
            const filename =
                rawFilename !== undefined
                    ? typeof rawFilename === "string"
                        ? sanitizePathSegment(rawFilename)
                        : rawFilename
                    : undefined
            if (path === null || (rawFilename !== undefined && filename === null)) {
                console.error("files.command: rejected unsafe path/filename", { cmd, rawPath, rawFilename })
                return { type: "error" }
            }
            return commands[filesystem][cmd](path, filename, ...others)
        }
        return commands[filesystem][cmd](...rest)
    }
    //console.log("Unknow command ", cmd, " for ", filesystem)
    return { type: "error" }
}



//everything in one object
const files: FilesModule = {
    command,
    capability,
    supported: supportedFileSystems,
}

export { files }

