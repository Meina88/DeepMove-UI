import { FunctionalComponent } from "preact"
import Modal from "../Controls/Modal"
import Button from "../Controls/Button"
import { useState, useEffect } from "preact/hooks"
import { T } from "../Translations"
import { setCurrentLanguage } from "../Translations"
import { useSettingsContext } from "../../contexts"
import { useHttpQueue } from "../../hooks"
import { useSettingsContextFn, useToastsContext } from "../../contexts"
import { espHttpURL } from "../Helpers"
import { exportPreferences, InterfaceSettingsData, ExportPreferences } from "../../tabs/interface/exportHelper"
import { Globe } from "preact-feather"

const LANGUAGE_OPTIONS: Record<string, string> = {
    de: "Deutsch",
    en: "English",
    es: "Español",
    fr: "Français",
    hu: "Magyar",
    id: "Bahasa Indonesia",
    it: "Italiano",
    ja: "日本語",
    ko: "한국어",
    pl: "Polski",
    ptbr: "Português (Brasil)",
    ru: "Русский",
    tr: "Türkçe",
    th: "ภาษาไทย",
    uk: "Українська",
    zhcn: "简体中文",
    zhtw: "繁體中文"
}

interface Props {
    visible: boolean
    onAccept: () => void
}

const SafetyDisclaimerModal: FunctionalComponent<Props> = ({
    visible,
    onAccept
}) => {

    const [confirmed, setConfirmed] = useState(false)
    const [step, setStep] = useState(0)
    const [language, setLanguage] = useState("en")
    const [langVersion, setLangVersion] = useState(0)
    const { interfaceSettings } = useSettingsContext()
    const { createNewRequest } = useHttpQueue()
    const { toasts } = useToastsContext()

    // 👉 cargar idioma guardado (opcional pero PRO)
    useEffect(() => {
        const settings = interfaceSettings.current.settings

        if (!settings) return

        let found = false

        for (const section in settings) {
            for (const sub in settings[section]) {
                const item = settings[section][sub]

                if (item.id === "language") {
                    found = true

                    if (item.value === "default") {
                        setLanguage("en")
                    } else {
                        setLanguage(
                            item.value.replace("lang-", "").replace(".json", "")
                        )
                    }
                }
            }
        }

        // 👉 solo si encontró language
        if (!found) return

    }, [interfaceSettings.current.settings])

    const saveLanguagePreference = (lang: string) => {
        const settings = interfaceSettings.current.settings

        for (const section in settings) {
            for (const sub in settings[section]) {
                const item = settings[section][sub]
                if (item.id === "language") {
                    item.value = lang === "en" ? "default" : `lang-${lang}.json`
                }
            }
        }

        const settingsToSave: ExportPreferences = exportPreferences(
            interfaceSettings.current as InterfaceSettingsData,
            false
        )

        const preferencesToSave = JSON.stringify(settingsToSave, null, " ")
        const blob = new Blob([preferencesToSave], {
            type: "application/json",
        })

        const preferencesFileName =
            `${useSettingsContextFn.getValue("HostUploadPath")}preferences.json`

        const formData = new FormData()
        const file = new File([blob], preferencesFileName)

        formData.append("path", useSettingsContextFn.getValue("HostUploadPath"))
        formData.append("creatPath", "true")
        formData.append("myfiles", file, preferencesFileName)
        formData.append(`${preferencesFileName}S`, String(preferencesToSave.length))

        createNewRequest(
            espHttpURL(useSettingsContextFn.getValue("HostTarget")),
            { method: "POST", id: "preferences", body: formData },
            {
                onSuccess: () => {
                    console.log("Language persisted")
                },
                onFail: (error: string) => {
                    console.log("Error saving language", error)
                    toasts.addToast({ content: error, type: "error" })
                },
            }
        )
    }

    const slides = [
        {
            title: T("DM_DISCLAIMER_1_TITLE"),
            body: T("DM_DISCLAIMER_1_BODY")
        },
        {
            title: T("DM_DISCLAIMER_2_TITLE"),
            body: T("DM_DISCLAIMER_2_BODY")
        },
        {
            title: T("DM_DISCLAIMER_3_TITLE"),
            body: T("DM_DISCLAIMER_3_BODY")
        },
        {
            title: T("DM_DISCLAIMER_4_TITLE"),
            body: T("DM_DISCLAIMER_4_BODY")
        }
    ]

    if (!visible) return null

    return (
        <Modal class="modal active">
            <Modal.Overlay />
            <Modal.Container>

                <Modal.Header>
                    <div class="modal-title h5">{T("DM_DISCLAIMER_TITLE")}</div>
                </Modal.Header>

                <Modal.Body>

                    {/* 👉 selector idioma SOLO en primer slide */}
                    {step === 0 && (
                        <div style={{ marginBottom: "16px" }}>

                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    marginBottom: "8px" // 👈 mover acá
                                }}
                            >
                                <Globe size={14} />

                                <div
                                    style={{
                                        fontSize: "11px",
                                        color: "var(--ms-text-secondary)",
                                        opacity: 0.7
                                    }}
                                >
                                    {T("S68")}
                                </div>
                            </div>
                            <select
                                value={language}
                                onChange={async (e) => {
                                    const lang = (e.target as HTMLSelectElement).value
                                    setLanguage(lang)

                                    try {
                                        if (lang === "en") {
                                            const { baseLangRessource } = await import("../Translations")
                                            setCurrentLanguage(baseLangRessource)
                                        } else {
                                            const response = await fetch(`/lang-${lang}.json`)
                                            const langJson = await response.json()
                                            setCurrentLanguage(langJson)
                                        }

                                        setLangVersion(prev => prev + 1)

                                    } catch (err) {
                                        console.log("Error loading language", err)
                                    }
                                }}
                                style={{
                                    padding: "6px",
                                    borderRadius: "6px",
                                    background: "var(--ms-bg-surface)",
                                    color: "var(--ms-text-primary)"
                                }}
                            >
                                {Object.entries(LANGUAGE_OPTIONS).map(([key, label]) => (
                                    <option key={key} value={key}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <p><b>{slides[step].title}</b></p>
                    <p>{slides[step].body}</p>

                    {step === slides.length - 1 && (
                        <>
                            <p style={{ marginTop: "12px" }}>
                                {T("DM_DISCLAIMER_FINAL")}
                            </p>

                            <label style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                                <input
                                    type="checkbox"
                                    checked={confirmed}
                                    onChange={(e) =>
                                        setConfirmed((e.target as HTMLInputElement).checked)
                                    }
                                />
                                {T("DM_DISCLAIMER_CHECK")}
                            </label>
                        </>
                    )}

                </Modal.Body>

                <Modal.Footer style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>

                    <div>
                        {step > 0 && (
                            <Button
                                class="btn btn-secondary"
                                onClick={() => setStep(prev => prev - 1)}
                            >
                                {T("S164")}
                            </Button>
                        )}
                    </div>

                    <div style={{ display: "flex", gap: "12px" }}>
                        {step < slides.length - 1 ? (
                            <Button
                                class="btn btn-primary btn-no-active"
                                onClick={() => setStep(prev => prev + 1)}
                            >
                                {T("S163")}
                            </Button>
                        ) : (
                            <Button
                                class="btn btn-next"
                                disabled={!confirmed}
                                onClick={() => {
                                    saveLanguagePreference(language)
                                    onAccept()
                                }}
                            >
                                {T("DM_DISCLAIMER_ACCEPT")}
                            </Button>
                        )}
                    </div>

                </Modal.Footer>

            </Modal.Container>
        </Modal>
    )
}

export default SafetyDisclaimerModal