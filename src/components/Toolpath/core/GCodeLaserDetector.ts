export type GCodeType = "CNC" | "LASER" | "UNKNOWN"

export function detectGCodeType(text: string): GCodeType {

    const lines = text
        .split("\n")
        .slice(0, 80)
        .map(l => l.trim().toUpperCase())

    let laserScore = 0
    let cncScore = 0

    for (const line of lines) {

        // =====================
        // LASER patterns
        // =====================

        if (line.includes("M4")) laserScore += 4

        if (line.match(/G[01].*S\d+/)) laserScore += 3

        if (line.match(/^X.*S\d+/)) laserScore += 2

        if (line.match(/G0.*S0/)) laserScore += 2


        // =====================
        // CNC patterns
        // =====================

        if (line.match(/G1.*Z-/)) cncScore += 5

        if (line.includes("G2") || line.includes("G3")) cncScore += 3

        if (line.includes("M7") || line.includes("M8")) cncScore += 3

        if (line.match(/T\d+/)) cncScore += 2

        if (line.match(/S\d+\s*M3/)) cncScore += 2
    }

    if (laserScore >= 4 && laserScore > cncScore) return "LASER"

    if (cncScore >= 4 && cncScore > laserScore) return "CNC"

    return "UNKNOWN"
}

export type GCodeBounds = {
    xmin: number
    xmax: number
    ymin: number
    ymax: number
    width: number
    height: number
}

export function computeBoundingBox(text: string): GCodeBounds | null {

    const lines = text.split("\n")

    let x = 0
    let y = 0

    let xmin = Infinity
    let xmax = -Infinity
    let ymin = Infinity
    let ymax = -Infinity

    for (const rawLine of lines) {

        const line = rawLine.trim().toUpperCase()

        if (!line || line.startsWith(";") || line.startsWith("(")) continue

        // Detect X / Y (aunque no haya G1)
        const xMatch = line.match(/X(-?\d+(\.\d+)?)/)
        const yMatch = line.match(/Y(-?\d+(\.\d+)?)/)

        if (xMatch) {
            x = Number(xMatch[1])
        }

        if (yMatch) {
            y = Number(yMatch[1])
        }

        // Actualizar bounding box SOLO si hay movimiento XY
        if (xMatch || yMatch) {

            if (x < xmin) xmin = x
            if (x > xmax) xmax = x

            if (y < ymin) ymin = y
            if (y > ymax) ymax = y
        }
    }

    if (xmin === Infinity) return null

    return {
        xmin,
        xmax,
        ymin,
        ymax,
        width: xmax - xmin,
        height: ymax - ymin
    }
}