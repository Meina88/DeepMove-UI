export function isLaserProgram(lines: string[]): boolean {
    const MAX_LINES = 30
    const slice = lines.slice(0, MAX_LINES)

    let hasM4 = false
    let g1WithSPowerCount = 0
    let sValues: number[] = []
    let hasCncStrongSignal = false

    for (let rawLine of slice) {
        const line = rawLine.trim().toUpperCase()

        if (!line || line.startsWith(";") || line.startsWith("(")) continue

        // 🔴 CNC señales fuertes (descartar láser inmediatamente)
        if (
            line.includes("G43") ||
            line.match(/\bT\d+\b/) ||
            line.includes("M6") ||
            line.includes("G81") ||
            line.includes("G83") ||
            line.includes("G41") ||
            line.includes("G42")
        ) {
            hasCncStrongSignal = true
        }

        // 🔥 M4 → Láser inmediato
        if (line.includes("M4")) {
            hasM4 = true
        }

        // Detectar S values
        const sMatch = line.match(/\bS(\d+(\.\d+)?)\b/)
        if (sMatch) {
            const sValue = parseFloat(sMatch[1])
            sValues.push(sValue)

            // Contar líneas con S > 0 (potencia real)
            if (sValue > 0) {
                g1WithSPowerCount++
            }
        }
    }

    // Si hay señal fuerte de CNC → no es láser
    if (hasCncStrongSignal) return false

    // Regla 1: M4 presente
    if (hasM4) return true

    // Regla 2: ≥3 líneas con potencia S activa
    if (g1WithSPowerCount >= 3) {
        const maxS = Math.max(...sValues)
        if (maxS <= 1000) return true
    }

    return false
}