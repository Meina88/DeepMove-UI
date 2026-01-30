/*
Files.js - ESP3D WebUI component file

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

import { Fragment, TargetedMouseEvent } from "preact"
import type { FunctionalComponent } from "preact"
import { useEffect, useRef, useState } from "preact/hooks"
import { T } from "../Translations"
import { useFilesManager, fileSizeString, getCurrentPath, setFileRef } from "../../hooks/useFilesManager"
import type { FileEntry, PanelMenuItem } from "../../types/files.types"
import { FilesTab } from "../../pages/tablet/FilesTab"
import { Loading, ButtonImg, FullScreenButton, CloseButton, ContainerHelper } from "../Controls"
import { useUiContextFn, useModalsContext } from "../../contexts"
import { showConfirmationModal } from "../Modal"
import { Upload, RefreshCcw, FolderPlus, CornerRightUp, XCircle, Plus } from "preact-feather"
import { SDCard } from "../../targets/CNC/FluidNC/icons"

import { files } from "../../targets"
import { Folder, File, Trash2, Play, Eye } from "preact-feather"
import { Menu as PanelMenu } from "./"
import { eventBus } from "../../hooks/eventBus"
import { espHttpURL } from "../Helpers/http"

const FilesPanel: FunctionalComponent = () => {
    const id = "filesPanel"
    const [state, actions] = useFilesManager()
    const [menu, setMenu] = useState<PanelMenuItem[] | null>(null)
    const fileref = useRef<HTMLInputElement | null>(null)


    const dropRef = useRef<HTMLDivElement | null>(null)
    const { modals } = useModalsContext()
    const [isFullScreen, setIsFullScreen] = useState<boolean>(false)
    const [selectedFile, setSelectedFile] = useState<string | null>(null)
    const [fabOpen, setFabOpen] = useState(false)

    
    // Register the file input ref with the hook
    useEffect(() => {
        setFileRef(fileref.current)
    }, [fileref])

    useEffect(() => {
        const listenerId = eventBus.on(
            "updateState",
            (data: any) => {
                if (data.id === "filesPanel") {
                    setIsFullScreen(data.isFullScreen)
                }
            },
            "filesPanel-fullscreen"
        )

        return () => {
            eventBus.off("updateState", listenerId)
        }
    }, [])

    useEffect(() => {
        const newMenu = () => {
            const fsItems: PanelMenuItem[] = files.supported
                .filter((fs: any) => fs.depend && fs.depend())
                .map((fs: any) => ({
                    label:
                        (state.fileSystem === fs.value ? "✓ " : "") + T(fs.name),
                    onClick: () => {
                        actions.onSelectFS({
                            target: { value: fs.value },
                        } as unknown as Event)
                    },
                }))

            const menuItems: PanelMenuItem[] = [
                {
                    label: T("Storage"),
                    icon: (
                        <span class="feather-icon-container">
                            <SDCard />
                        </span>
                    ),
                    onClick: () => { }, // título visual
                },

                ...fsItems,

                { divider: true },

                { divider: true },

                {
                    label: T("S50"),
                    icon: (
                        <span class="feather-icon-container">
                            <RefreshCcw />
                        </span>
                    ),
                    onClick: actions.onRefresh,
                },
            ]

            return menuItems
        }

        setMenu(newMenu())
    }, [state.fileSystem])


    useEffect(() => {
    if (!fabOpen) return

    const close = () => setFabOpen(false)
    document.addEventListener("click", close)

    return () => document.removeEventListener("click", close)
}, [fabOpen])



    // Render compact panel view
    const renderCompactView = () => {
        const currentPath = getCurrentPath()


        return (
            <div class="panel panel-dashboard" id={id}>
                <ContainerHelper id={id} />
                {!isFullScreen && (
                    <Fragment>
                        <input type="file" ref={fileref} class="d-none" onChange={(e) => actions.filesSelected(e)} />
                        <div class="navbar files-navbar">
                            {/* ── IZQUIERDA: título + info SD ── */}
                            <span class="navbar-section files-navbar-left feather-icon-container">
                                <SDCard />
                                <strong class="text-ellipsis">{T("S65")}</strong>

                                {!state.isLoading && state.filesList && (
                                    <span class="files-sd-text">
                                        SD: {state.filesList.used} / {state.filesList.total}
                                    </span>
                                )}
                            </span>

                            {/* ── DERECHA: barra + acciones ── */}
                            <span class="navbar-section files-navbar-right">
                                {!state.isLoading && state.filesList && state.filesList.occupation !== undefined && (
                                    <span class="files-sd-bar">
                                        <span
                                            class="files-sd-bar-fill"
                                            style={{ width: `${state.filesList.occupation}%` }}

                                        />
                                    </span>
                                )}

                                <span class="full-height">
                                    {state.fileSystem != "" && !state.isLoading && <PanelMenu items={menu || []} />}
                                    <FullScreenButton elementId={id} />
                                    <CloseButton elementId={id} hideOnFullScreen={true} />
                                </span>
                            </span>
                        </div>

                        <div
                            ref={dropRef}
                            class="drop-zone files-list m-1"
                            onClick={(e) => {
                                // si el click fue directamente sobre el fondo del listado
                                if (e.target === e.currentTarget) {
                                    setSelectedFile(null)
                                }
                            }}

                            onDragOver={(e) => {
                                dropRef.current?.classList.add("drop-zone--over")
                                e.preventDefault()
                            }}
                            onDragLeave={(e) => {
                                dropRef.current?.classList.remove("drop-zone--over")
                                e.preventDefault()
                            }}
                            onDragEnd={(e) => {
                                dropRef.current?.classList.remove("drop-zone--over")
                                e.preventDefault()
                            }}
                            onDrop={(e) => {
                                dropRef.current?.classList.remove("drop-zone--over")
                                const dt = e.dataTransfer as DataTransfer
                                if (dt && dt.files.length) {
                                    const length = dt.items.length
                                    if (!fileref.current || (!fileref.current.multiple && length > 1)) {
                                        e.preventDefault()
                                        return
                                    }
                                }

                                if (fileref.current)
                                    (fileref.current as unknown as { files: FileList }).files = dt.files

                                actions.filesSelected(e as unknown as Event)
                                e.preventDefault()
                            }}>
                            {state.isLoading && state.fileSystem != "" && (
                                <Fragment>
                                    <div style="text-align:center">
                                        <Loading class="m-2" />

                                        <ButtonImg
                                            donotdisable
                                            icon={<XCircle />}
                                            label={T("S28")}
                                            btooltip
                                            data-tooltip={T("S28")}
                                            onClick={actions.onCancel}
                                        />
                                    </div>
                                </Fragment>
                            )}

                            {!state.isLoading && state.fileSystem != "" && state.filesList && (
                                <Fragment>
                                    {currentPath[state.fileSystem] != "/" && (
                                        <div
                                            class="file-line file-line-name"
                                            onClick={(e: TargetedMouseEvent<HTMLDivElement>) => {
                                                useUiContextFn.haptic()
                                                const newpath = currentPath[state.fileSystem].substring(
                                                    0,
                                                    currentPath[state.fileSystem].lastIndexOf("/")
                                                )

                                                currentPath[state.fileSystem] = newpath.length == 0 ? "/" : newpath
                                                actions.onRefresh(
                                                    e,
                                                    false
                                                )
                                            }}>
                                            <div class="form-control go-previous file-line-name file-line-action">
                                                <CornerRightUp />
                                                <label class="go-previous-text">...</label>
                                            </div>
                                        </div>
                                    )}
                                    {state.filesList.files.map((line: FileEntry) => {
                                        const canDownloadOrOpen =
                                            files.capability(state.fileSystem, "Download") || line.size == -1

                                        const canProcess =
                                            line.size != -1 &&
                                            files.capability(
                                                state.fileSystem,
                                                "Process",
                                                currentPath[state.fileSystem],
                                                line.name
                                            )

                                        const canDelete = files.capability(
                                            state.fileSystem,
                                            line.size == -1 ? "DeleteDir" : "DeleteFile",
                                            currentPath[state.fileSystem],
                                            line.name
                                        )

                                        return (
                                            <div
                                                class={`file-item form-control ${selectedFile === line.name ? "is-selected" : ""}`}
                                                key={line.name}
                                                onClick={() => {
                                                    setSelectedFile(line.name)
                                                }}
                                            >

                                                {/* ─── Fila superior: nombre + tamaño ─── */}
                                                <div
                                                    class={`file-item-header ${canDownloadOrOpen ? "file-line-action" : ""}`}
                                                    onClick={(e: TargetedMouseEvent<HTMLDivElement>) => {
                                                        useUiContextFn.haptic()
                                                        actions.ElementClicked(e as unknown as Event, line)
                                                    }}
                                                >
                                                    <div class="file-item-name">
                                                        {line.size == -1 ? <Folder /> : <File />}
                                                        <span class="text-ellipsis">{line.name}</span>
                                                    </div>

                                                    {line.size != -1 && <div class="file-item-size">{fileSizeString(line.size)}</div>}
                                                </div>

                                                {/* ─── Fila inferior: botones (izq Trash / der Play) ─── */}
                                                <div class="file-item-actions">
                                                    <div class="file-item-actions-inner">
                                                        <div class="file-item-action-left">
                                                            {canDelete && (
                                                                <ButtonImg
                                                                    class="file-trash-btn"
                                                                    m1
                                                                    ltooltip
                                                                    data-tooltip={line.size == -1 ? T("S101") : T("S100")}
                                                                    icon={<Trash2 />}
                                                                    onClick={(e: TargetedMouseEvent<HTMLButtonElement>) => {
                                                                        useUiContextFn.haptic()
                                                                        e.currentTarget.blur()

                                                                        const content = (
                                                                            <Fragment>
                                                                                <div>{line.size == -1 ? T("S101") : T("S100")}:</div>
                                                                                <div style="text-align:center">
                                                                                    <li>{line.name}</li>
                                                                                </div>
                                                                            </Fragment>
                                                                        )

                                                                        showConfirmationModal({
                                                                            modals,
                                                                            title: T("S26"),
                                                                            content,
                                                                            button1: { cb: () => actions.deleteCommand(line), text: T("S27") },
                                                                            button2: { text: T("S28") },
                                                                        })
                                                                    }}
                                                                />
                                                            )}
                                                        </div>

                                                        <div class="file-item-action-center" />

                                                        <div class="file-item-action-right">
                                                            {canProcess && (
                                                                <>
                                                                    {/* 👁 Preview G-code (solo visual) */}
                                                                    <ButtonImg
                                                                        m1
                                                                        ltooltip
                                                                        data-tooltip={T("Preview")}
                                                                        icon={<Eye />}
                                                                        class="file-preview-btn"
                                                                        onClick={(e: TargetedMouseEvent<HTMLButtonElement>) => {
                                                                            e.currentTarget.blur()
                                                                            useUiContextFn.haptic()

                                                                            // ✅ armar URL de descarga igual que useFilesManager
                                                                            const cmd = files.command(
                                                                                state.fileSystem,
                                                                                "download",
                                                                                currentPath[state.fileSystem],
                                                                                line.name
                                                                            )
                                                                            const url = espHttpURL(cmd.url, cmd.args)

                                                                            const isMobile = window.innerWidth <= 768

                                                                            if (isMobile) {
                                                                                document
                                                                                    .getElementById("toolpathPanel")
                                                                                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                                                                            }


                                                                            eventBus.emit("toolpath:preview", {
                                                                                url,
                                                                                filename: line.name,
                                                                            })
                                                                        }}
                                                                    />


                                                                    {/* ▶ Ejecutar G-code */}
                                                                    <ButtonImg
                                                                        m1
                                                                        ltooltip
                                                                        data-tooltip={T("S74")}
                                                                        icon={<Play />}
                                                                        class="file-play-btn"


                                                                        onClick={(e: TargetedMouseEvent<HTMLButtonElement>) => {
                                                                            e.currentTarget.blur()
                                                                            useUiContextFn.haptic()


                                                                            const isMobile = window.innerWidth <= 768

                                                                            if (isMobile) {
                                                                                document
                                                                                    .getElementById("OverridesPanel")

                                                                                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                                                                            }




                                                                            const isSmallScreen = window.innerWidth <= 768

                                                                            const previewOnPlay = isSmallScreen
                                                                                ? useUiContextFn.getValue("filesPreviewOnPlayMobile")
                                                                                : useUiContextFn.getValue("filesPreviewOnPlayDesktop")

                                                                            // ▶ Ejecutar G-code (SIEMPRE)
                                                                            const cmd = files.command(
                                                                                state.fileSystem,
                                                                                "play",
                                                                                currentPath[state.fileSystem],
                                                                                line.name
                                                                            )

                                                                            // 🔽 Preview del toolpath (OPCIONAL)
                                                                            if (previewOnPlay) {
                                                                                const dl = files.command(
                                                                                    state.fileSystem,
                                                                                    "download",
                                                                                    currentPath[state.fileSystem],
                                                                                    line.name
                                                                                )

                                                                                const url = espHttpURL(dl.url, dl.args)

                                                                                eventBus.emit("toolpath:preview", {
                                                                                    url,
                                                                                    filename: line.name,
                                                                                })

                                                                                // pequeña espera para evitar competir con memoria
                                                                                setTimeout(() => {
                                                                                    actions.sendSerialCmd(cmd.cmd)
                                                                                }, 150)
                                                                            } else {
                                                                                actions.sendSerialCmd(cmd.cmd)
                                                                            }
                                                                        }}


                                                                    />
                                                                </>
                                                            )}
                                                        </div>

                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}

                                </Fragment>
                            )}
                        </div>

                        {/* Floating Upload Button (+) */}
                        
<div class={`files-fab-wrapper ${fabOpen ? "is-open" : ""}`}>

    {/* Action: Upload file */}
    <button
        type="button"
        class="files-fab-action"
        aria-label={T("S89")}
        onClick={(e) => {
            e.stopPropagation()
            setFabOpen(false)
            actions.openFileUploadBrowser()
        }}>
        <Upload />
    </button>

    {/* Action: Create directory */}

<button
    type="button"
    class="files-fab-action"
    aria-label={T("S88")}
    onClick={(e) => {
        e.stopPropagation()
        setFabOpen(false)
        actions.showCreateDirModal()
    }}>
    <FolderPlus />
</button>


    {/* Main FAB */}
    <button
        type="button"
        class="files-upload-fab"
        aria-label={T("S89")}
        onClick={(e) => {
            e.stopPropagation()
            setFabOpen((v) => !v)
        }}>
        <Plus />
    </button>
</div>





                    </Fragment>
                )}

                {isFullScreen && <FilesTab></FilesTab>}
            </div>
        )
    }

    return renderCompactView()
}

const FilesPanelElement = {
    id: "filesPanel",
    content: <FilesPanel />,
    name: "S65",
    icon: "SDCard",
    show: "showfilespanel",
    onstart: "openfilesonstart",
    settingid: "files",
}

export { FilesPanel, FilesPanelElement }
