/**
 * Stores the session id assigned by the controller (CURRENTID message) so it
 * can be included in outgoing PING messages and compared against ACTIVEID
 * messages from other sessions.
 */
export class SessionManager {
    private sessionId: string | undefined

    setSessionId(sessionId: string): void {
        this.sessionId = sessionId
    }

    getSessionId(): string | undefined {
        return this.sessionId
    }
}
