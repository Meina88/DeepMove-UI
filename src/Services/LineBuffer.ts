/**
 * Appends `incoming` (with \r stripped) to `buffer` and extracts every
 * complete line (terminated by \n). Returns the extracted lines in order and
 * the remaining incomplete tail to carry over into the next call.
 */
export function extractLines(buffer: string, incoming: string): { lines: string[]; remainder: string } {
    let combined = buffer + incoming.replace(/\r/g, "")
    const lines: string[] = []

    let endLineIndex = combined.indexOf("\n")
    while (endLineIndex >= 0) {
        lines.push(combined.substring(0, endLineIndex))
        combined = combined.substring(endLineIndex + 1)
        endLineIndex = combined.indexOf("\n")
    }

    return { lines, remainder: combined }
}
