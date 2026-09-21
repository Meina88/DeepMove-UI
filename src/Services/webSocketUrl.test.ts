import { describe, expect, it } from "vitest"
import { resolveWebSocketUrl } from "./webSocketUrl"

const base = { hostname: "192.168.1.50", locationPort: "", webCommunication: "Synchronous" }

describe("resolveWebSocketUrl", () => {
    it("FluidNC 4.x: the reported port is the HTTP port itself, at path /", () => {
        expect(resolveWebSocketUrl({ ...base, reportedPort: "80" })).toBe("ws://192.168.1.50:80")
    })

    it("FluidNC 4.x on a custom HTTP port must not add 2", () => {
        // The old code computed location.port + 2 = 8082 here, which nothing listens on
        expect(resolveWebSocketUrl({ ...base, locationPort: "8080", reportedPort: "8080" })).toBe(
            "ws://192.168.1.50:8080"
        )
    })

    it("FluidNC 3.x: the reported port already is HTTP port + 2", () => {
        expect(resolveWebSocketUrl({ ...base, reportedPort: "82" })).toBe("ws://192.168.1.50:82")
        expect(resolveWebSocketUrl({ ...base, locationPort: "8080", reportedPort: "8082" })).toBe(
            "ws://192.168.1.50:8082"
        )
    })

    it("accepts the reported port as a number", () => {
        expect(resolveWebSocketUrl({ ...base, reportedPort: 8090 })).toBe("ws://192.168.1.50:8090")
    })

    it("falls back to the page's port, then to 80, when the report has no usable port", () => {
        expect(resolveWebSocketUrl({ ...base, locationPort: "8080", reportedPort: undefined })).toBe(
            "ws://192.168.1.50:8080"
        )
        expect(resolveWebSocketUrl({ ...base, reportedPort: "" })).toBe("ws://192.168.1.50:80")
        expect(resolveWebSocketUrl({ ...base, reportedPort: "abc" })).toBe("ws://192.168.1.50:80")
    })

    it("uses /ws unless the controller reports Synchronous communication", () => {
        expect(resolveWebSocketUrl({ ...base, webCommunication: "Asynchronous", reportedPort: "81" })).toBe(
            "ws://192.168.1.50:81/ws"
        )
        expect(resolveWebSocketUrl({ ...base, webCommunication: undefined, reportedPort: "81" })).toBe(
            "ws://192.168.1.50:81/ws"
        )
    })
})
