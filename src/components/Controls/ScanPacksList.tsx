/*
ScanPacksList.js - ESP3D WebUI component file
*/

import { Fragment } from "preact"
import { useState, useEffect } from "preact/hooks"
import { ButtonImg, Loading } from "./../Controls"
import { useHttpQueue } from "../../hooks"
import { espHttpURL } from "../../components/Helpers"
import {
    useUiContextFn,
    useSettingsContextFn,
    useModalsContext,
    useToastsContext,
} from "../../contexts"
import { T, getLanguageName } from "./../Translations"
import { CheckCircle } from "preact-feather"

interface ScanPacksListProps {
    id: string
    value?: string
    setValue: (val: string) => void
    refreshfn: (fn: () => void) => void
}

interface PackFileEntry {
    name: string
}

const ScanPacksList = ({
    id,
    value,
    setValue,
    refreshfn,
}: ScanPacksListProps) => {
    const { modals } = useModalsContext()
    const { toasts } = useToastsContext()
    const [isLoading, setIsLoading] = useState(true)
    const [packsList, setPacksList] = useState<PackFileEntry[]>([])
    const { createNewRequest } = useHttpQueue()

    const ScanPacks = () => {
        setIsLoading(true)

        createNewRequest(
            espHttpURL(
                useSettingsContextFn.getValue("HostTarget"),
                {
                    path: useSettingsContextFn.getValue("HostUploadPath"),
                }
            ),
            { method: "GET" },
            {
                onSuccess: (result: string) => {
                    setIsLoading(false)
                    const listFiles = JSON.parse(result)
                    setPacksList(listFiles.files as PackFileEntry[])
                },
                onFail: (error: string) => {
                    setIsLoading(false)
                    toasts.addToast({ content: error, type: "error" })
                    setPacksList([])
                },
            }
        )
    }

    useEffect(() => {
        ScanPacks()
        refreshfn(ScanPacks)
    }, [])

    return (
        <Fragment>
            {isLoading && <Loading />}

            {!isLoading && (
                <table class="table">
                    <thead class="hide-low">
                        <tr>
                            <th>
                                {id === "languagePickup"
                                    ? T("S67")
                                    : T("S183")}
                            </th>
                            <th>{T("S178")}</th>
                        </tr>
                    </thead>

                    <tbody>
                        {/* DEFAULT / NONE */}
                        <tr>
                            <td>
                                {id === "languagePickup"
                                    ? T("lang", true)
                                    : T("none")}
                            </td>
                            <td>
                                <ButtonImg
                                    m2
                                    ltooltip
                                    class={
                                        value === "default"
                                            ? "select-active"
                                            : "select-inactive"
                                    }
                                    data-tooltip={
                                        id === "languagePickup"
                                            ? T("S179")
                                            : T("S180")
                                    }
                                    icon={<CheckCircle />}
                                    onClick={() => {
                                        useUiContextFn.haptic()
                                        setValue("default")
                                        modals.removeModal(
                                            modals.getModalIndex(id)
                                        )
                                    }}
                                />
                            </td>
                        </tr>

                        {/* PACKS */}
                        {packsList.map((e) => {
                            if (
                                (id === "languagePickup" &&
                                    e.name.match(
                                        /^lang-\w*.json(.gz)*/g
                                    )) ||
                                (id === "themePickup" &&
                                    e.name.match(/^theme-\w*(.gz)*/g))
                            ) {
                                const entryValue = e.name.replace(".gz", "")

                                return (
                                    <tr>
                                        <td>
                                            <span
                                                class="tooltip tooltip-right"
                                                data-tooltip={e.name}
                                            >
                                                {id === "languagePickup"
                                                    ? getLanguageName(
                                                          entryValue
                                                      )
                                                    : entryValue.replace(
                                                          "theme-",
                                                          ""
                                                      )}
                                            </span>
                                        </td>

                                        <td>
                                            <ButtonImg
                                                m2
                                                ltooltip
                                                class={
                                                    value === entryValue
                                                        ? "select-active"
                                                        : "select-inactive"
                                                }
                                                data-tooltip={
                                                    id === "languagePickup"
                                                        ? T("S179")
                                                        : T("S180")
                                                }
                                                icon={<CheckCircle />}
                                                onClick={() => {
                                                    useUiContextFn.haptic()
                                                    setValue(entryValue)
                                                    modals.removeModal(
                                                        modals.getModalIndex(
                                                            id
                                                        )
                                                    )
                                                }}
                                            />
                                        </td>
                                    </tr>
                                )
                            }
                            return null
                        })}
                    </tbody>
                </table>
            )}
        </Fragment>
    )
}

export { ScanPacksList }
