import { useEffect, useRef } from "preact/hooks";
import { getWebSocketService, useWebSocketService } from "../../hooks/useWebSocketService";
import { useSettings } from "../../hooks/useSettings";
import { useSettingsContext } from "../../contexts/SettingsContext";

export function ConnectionManager() {
    const { connectionSettings } = useSettingsContext();
    const { restartPolling } = useSettings();
    // The listener below is registered once but must always call the latest
    // closure (it reads contexts that change between renders).
    const restartPollingRef = useRef(restartPolling);
    restartPollingRef.current = restartPolling;
    // Calling the hook (regardless of its return value) is what creates the
    // WebSocketService singleton - without a mounted caller it never gets
    // instantiated and getWebSocketService() below stays undefined forever.
    useWebSocketService();

    useEffect(() => {
        // Connect if WebCommunication is enabled
        if (connectionSettings.current?.WebCommunication) {
            const service = getWebSocketService();

            if (service) {
                // Polling is stopped when the link is lost (it would only fail
                // without a socket), so it has to be started again once the
                // link is back.
                service.setReconnectedListener(() => restartPollingRef.current());
                service.connect().catch(error => {
                    console.error("Failed to connect:", error);
                });
            } else {
                console.warn("WebSocketService not yet initialized - cannot connect");
            }
        }
    }, [connectionSettings, connectionSettings.current.WebCommunication]);

    // This component doesn't render anything
    return null;
}
