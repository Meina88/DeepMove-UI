import { FunctionalComponent } from "preact"
import { useEffect, useState } from "preact/hooks"
import { AppLogo } from "../../targets/CNC/FluidNC/logo"
import { DeepMoveIcon } from "../../targets/CNC/FluidNC/icons"

const Splash: FunctionalComponent = () => {
    const [phase, setPhase] = useState<"init" | "fadeIn" | "visible" | "fadeOut">("init")

    useEffect(() => {
        const fadeDuration = 1200
        const visibleDuration = 4000

        // Forzar transición real
        const start = requestAnimationFrame(() => {
            setPhase("fadeIn")
        })

        const t1 = setTimeout(() => setPhase("visible"), fadeDuration)
        const t2 = setTimeout(() => setPhase("fadeOut"), fadeDuration + visibleDuration)

        return () => {
            cancelAnimationFrame(start)
            clearTimeout(t1)
            clearTimeout(t2)
        }
    }, [])

return (
    <div class="splash-screen">
        <div class={`splash-content ${phase}`}>
            <div
                class="splash-logo-row"
                style={{ color: "hsl(205, 90%, 52%)" }}
            >
                <DeepMoveIcon height="70px" />
                <AppLogo height="60px" />
            </div>

            <p class="splash-sub">
                ESP3D&nbsp;·&nbsp;FluidNC
            </p>
        </div>
    </div>
)

}

export { Splash }
