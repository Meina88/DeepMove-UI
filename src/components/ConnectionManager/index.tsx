import { useEffect } from "preact/hooks";
import { getWebSocketService, useWebSocketService } from "../../hooks/useWebSocketService";
import { useSettingsContext } from "../../contexts/SettingsContext";

export function ConnectionManager() {
    const { connectionSettings } = useSettingsContext();
    // Calling the hook (regardless of its return value) is what creates the
    // WebSocketService singleton - without a mounted caller it never gets
    // instantiated and getWebSocketService() below stays undefined forever.
    useWebSocketService();

    useEffect(() => {
        // Connect if WebCommunication is enabled
        if (connectionSettings.current?.WebCommunication) {
            const service = getWebSocketService();

            if (service) {
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