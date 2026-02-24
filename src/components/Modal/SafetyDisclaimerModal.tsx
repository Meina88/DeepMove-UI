import { FunctionalComponent } from "preact"
import Modal from "../Controls/Modal"
import Button from "../Controls/Button"
import { useState } from "preact/hooks"
import { T } from "../Translations"

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
                                onClick={() => setStep(step - 1)}
                            >
                                Back
                            </Button>
                        )}
                    </div>

                    <div style={{ display: "flex", gap: "12px" }}>
                        {step < slides.length - 1 ? (
                            <Button
                                class="btn btn-primary btn-no-active"
                                onClick={() => setStep(step + 1)}
                            >
                                Next
                            </Button>
                        ) : (
                            <Button
                                class="btn btn-next"
                                disabled={!confirmed}
                                onClick={onAccept}
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