# Websocket

there are 2

-   terminal websocket
    used to stream data to webUIand exchange internal data

-   data websocket
    used to exchange data

## Terminal websocket

subprotocol: `webui-v3`

port: webport number + 1

### <u>text mode</u>

Reserved
messages between webui / ESP
Format: `<label>:<message>`

-   from ESP to WebUI

    -   `currentID:<id>`
        Sent when client is connecting, it is the last ID used and become the active ID

    -   `activeID:<id>`
        Broadcast current active ID, when new client is connecting, client without this is <id> should close, ESP WS Server close all open WS connections but this one also

    -   `PING:<time left>:<time out>`
        It is a response to PING from client to inform the time left if no activity (see below)

    -   `ERROR:<code>:<message>`
        If an error raise when doing upload, it informs client it must stop uploading because sometimes the http answer is not possible,
        or cannot cancel the upload, this is a workaround as there is no API in current webserver to cancel active upload

    -   `NOTIFICATION:<message>`
        Forward the message sent by [ESP600] to webUI toast system

    -   `SENSOR: <value>[<unit>] <value2>[<unit2>] ...`
        The sensor connected to ESP like DHT22

-   from WebUI to ESP
    -   `PING:<current cookiesessionID / none >` if any, or "none" if none

### <u>binary mode</u>

Reserved

-   from ESP to WebUI
    stream data from ESP to WebUI

-   from WEBUI to ESP  
    [-> File transfert from WebUI to ESP : not implemented yet]

## FluidNC 3.x vs 4.x (terminal websocket)

The port stated at the top of the terminal websocket section (`webport + 1`) is out of date; what actually applies depends on the firmware generation. The port and path to use are **always** the ones reported by `[ESP800]json=yes` (`WebSocketPort`, `WebCommunication`) - see `src/Services/webSocketUrl.ts`.

| | FluidNC 3.x (FluidMill) | FluidNC 4.x (FluidStation) |
|---|---|---|
| Server | separate `WebSocketsServer`, subprotocol `webui-v3` | `AsyncWebSocket("/")` on the HTTP server itself |
| Port | HTTP port **+ 2** (reported by `[ESP800]` as `WebSocketPort`) | HTTP port (reported as `WebSocketPort`) |
| Path | `""` (`WebCommunication: Synchronous`) | `""` (`WebCommunication: Synchronous`) |
| On connect | `currentID:<id>`, then broadcasts `activeID:<id>` to all clients | `currentID:<id>` and `CURRENT_ID:<id>` to that client only. **`activeID` is not sent** |
| Other sessions | the new connection disconnects every other client | session = `sessionId` cookie; the new connection closes older sockets **of the same cookie** |
| Keep-alive | replies `PING:60000:60000` to a text `PING:<id>` | same reply, plus the server sends a bare `PING\n` every 10 s and reaps channels silent for 60 s whose socket is gone |
| Data / control | data as **binary** frames, control messages as **text** frames | same |
| Frames from the UI | text or binary frames both end up in `Channel::push()`, byte by byte; realtime characters go through a UTF-8 decoder with `PASS_THROUGH_80_BF` (so `C2 9A` and a raw `9A` both mean 0x9A) | same |

Consequences the client has to handle:
- Control messages are text frames **without a trailing newline** (except the 4.x `PING\n`). They must not be appended to the line buffer of the binary data stream or they end up glued to the front of the next line (usually a status report). See `isControlMessage()` in `NotificationHandlers.ts`.
- On 4.x a socket can be closed by the firmware because another page of the same browser session connected, and no `activeID` says so. The client should reconnect, with a bounded number of attempts.
- On 4.x `GET /command?cmd=...&PAGEID=<id>` for G-code/realtime commands is routed to the channel with exactly that id (or to the session's channel when `PAGEID` is absent) and answers `500 WebSocket dead` if there is none. On 3.x `PAGEID` is ignored and the most recently used channel is taken. A client that keeps sending the id of a closed socket therefore fails every command on 4.x.

## Data websocket

protocol: `arduino`
port: configurable in settings

### <u>text mode</u>

Free to use

### <u>binary mode</u>

Free to use
