export interface WebSocketUrlInput {
    /** Host the page was loaded from (document.location.hostname) */
    hostname: string
    /** `WebSocketPort` as reported by [ESP800]json=yes */
    reportedPort: string | number | undefined
    /** Port the page was loaded from (document.location.port, "" for the scheme default) */
    locationPort: string
    /** `WebCommunication` as reported by [ESP800]json=yes */
    webCommunication: string | undefined
}

/**
 * Builds the WebSocket URL from what the controller says about itself.
 *
 * The port must come from [ESP800]'s `WebSocketPort` rather than being derived
 * from the page's port: FluidNC 3.x served WebUI v3 on a second server at
 * HTTP port + 2 (and reports it that way), while FluidNC 4.x serves it on the
 * HTTP port itself, at path "/". Only the reported value is right for both.
 * The page's own port is used only if the report has no usable port.
 */
export function resolveWebSocketUrl({ hostname, reportedPort, locationPort, webCommunication }: WebSocketUrlInput): string {
    const reported = parseInt(String(reportedPort ?? ""), 10)
    const fromLocation = parseInt(locationPort, 10)
    const port = reported > 0 ? reported : fromLocation > 0 ? fromLocation : 80
    const path = webCommunication === "Synchronous" ? "" : "/ws"
    return `ws://${hostname}:${port}${path}`
}
