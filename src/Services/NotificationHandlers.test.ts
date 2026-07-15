import { describe, expect, it } from "vitest"
import {
    createConnectionErrorToast,
    createConnectionStatusToast,
    createMaxReconnectionToast,
    createReconnectionToast,
    parseError,
    parseNotification,
} from "./NotificationHandlers"

describe("parseNotification", () => {
    it("parses a well-formed NOTIFICATION message, including the Type in the content", () => {
        expect(parseNotification("NOTIFICATION:Success:File uploaded")).toEqual({
            content: "Success:File uploaded",
            type: "success",
        })
    })

    it("maps Error/Success/Warning-prefixed types to their toast type", () => {
        expect(parseNotification("NOTIFICATION:Error:disk full")).toEqual({
            content: "Error:disk full",
            type: "error",
        })
        expect(parseNotification("NOTIFICATION:Warning:low battery")).toEqual({
            content: "Warning:low battery",
            type: "warning",
        })
    })

    it("falls back to type 'notification' for an unrecognized Type", () => {
        expect(parseNotification("NOTIFICATION:Info:something")).toEqual({
            content: "Info:something",
            type: "notification",
        })
    })

    it("joins remaining colon-separated parts back into the content", () => {
        expect(parseNotification("NOTIFICATION:Success:a:b:c")).toEqual({
            content: "Success:a:b:c",
            type: "success",
        })
    })

    it("returns null when there are fewer than 3 colon-separated parts", () => {
        expect(parseNotification("NOTIFICATION")).toBeNull()
        expect(parseNotification("NOTIFICATION:Success")).toBeNull()
    })
})

describe("parseError", () => {
    it("parses a well-formed ERROR message", () => {
        expect(parseError("ERROR:500:Internal failure")).toEqual({
            content: "Error code 500: Internal failure",
            type: "error",
        })
    })

    it("joins remaining colon-separated parts into the error message", () => {
        expect(parseError("ERROR:404:Not:Found")).toEqual({
            content: "Error code 404: Not:Found",
            type: "error",
        })
    })

    it("returns null when there are fewer than 3 colon-separated parts", () => {
        expect(parseError("ERROR")).toBeNull()
        expect(parseError("ERROR:500")).toBeNull()
    })
})

describe("createConnectionErrorToast", () => {
    it("maps known reasons to their specific message", () => {
        expect(createConnectionErrorToast("sessiontimeout")).toEqual({
            content: "Session timeout - please reconnect",
            type: "error",
        })
        expect(createConnectionErrorToast("connectionlost")).toEqual({
            content: "Connection lost - attempting to reconnect",
            type: "error",
        })
        expect(createConnectionErrorToast("already connected")).toEqual({
            content: "Already connected from another session",
            type: "error",
        })
    })

    it("falls back to the unknown-reason message for an unrecognized reason", () => {
        expect(createConnectionErrorToast("something-else")).toEqual({
            content: "Unknown connection error",
            type: "error",
        })
    })
})

describe("createConnectionStatusToast", () => {
    it("maps each known status to its toast", () => {
        expect(createConnectionStatusToast("connected")?.type).toBe("success")
        expect(createConnectionStatusToast("connecting")?.type).toBe("notification")
        expect(createConnectionStatusToast("reconnecting")?.type).toBe("warning")
        expect(createConnectionStatusToast("disconnected")?.type).toBe("notification")
    })

    it("returns null for an unrecognized status", () => {
        expect(createConnectionStatusToast("unknown-status")).toBeNull()
    })
})

describe("createReconnectionToast", () => {
    it("formats the attempt/max counter", () => {
        expect(createReconnectionToast(2, 5)).toEqual({
            content: "Reconnection attempt 2/5",
            type: "warning",
        })
    })
})

describe("createMaxReconnectionToast", () => {
    it("returns a fixed error toast", () => {
        expect(createMaxReconnectionToast()).toEqual({
            content: "Maximum reconnection attempts reached. Please check your connection.",
            type: "error",
        })
    })
})
