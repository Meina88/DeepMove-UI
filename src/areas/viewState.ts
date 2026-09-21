import type { ConnectionState } from "../contexts/UiContext"

/*
 * The main view (menu + dashboard/settings) may only be shown once the UI has
 * finished loading its settings (`ui.ready`), not merely once the controller
 * link is up. The WebSocket connects as soon as [ESP800] has answered, which
 * is usually *before* preferences.json/language/theme have been fetched over
 * the serial HTTP queue; until then `uisettings` is undefined, so anything
 * that reads it (notably the dashboard's one-shot panel initialization)
 * would run against empty settings and latch that result for good.
 */
export function canShowMainView(connection: ConnectionState, uiReady: boolean): boolean {
    return connection.connected && !connection.updating && uiReady
}
