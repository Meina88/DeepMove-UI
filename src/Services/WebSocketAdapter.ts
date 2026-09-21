/**
 * WebSocket adapter that provides a SerialPort-like interface
 * for use with WebSocketService
 */

export type DataListener = (data: string) => void;
export type BinaryDataListener = (data: ArrayBuffer) => void;
export type ErrorListener = (error: Event) => void;

export class WebSocketAdapter {
    private ws: WebSocket;
    private readonly url: string;
    private dataListeners: DataListener[] = [];
    private binaryDataListeners: BinaryDataListener[] = [];
    private errorListeners: ErrorListener[] = [];
    private isOpenFlag: boolean = false;

    constructor(url: string) {
        this.url = url;
        this.ws = this.createSocket();
    }

    /**
     * A browser WebSocket can never be reopened once it has closed, so every
     * (re)connection needs a fresh one. The listeners registered on this
     * adapter live on the adapter itself and carry over to each new socket.
     */
    private createSocket(): WebSocket {
        const socket = new WebSocket(this.url, "webui-v3");
        socket.binaryType = "arraybuffer";
        this.isOpenFlag = false;
        this.setupEventListeners(socket);
        return socket;
    }

    private setupEventListeners(socket: WebSocket) {
        // Events from a socket that has since been replaced must not touch the
        // state of the current one (a late "close" would otherwise mark the
        // new connection as closed).
        const isCurrent = () => socket === this.ws;

        socket.onopen = () => {
            if (!isCurrent()) return;
            this.isOpenFlag = true;
            console.log("WebSocket connected");
        };

        socket.onmessage = (event) => {
            if (!isCurrent()) return;
            // Handle binary data
            if (event.data instanceof ArrayBuffer) {
                this.notifyBinaryListeners(event.data);
            } else {
                // Handle text data
                const data = event.data as string;
                this.notifyListeners(data);
            }
        };

        socket.onerror = (error) => {
            if (!isCurrent()) return;
            console.error("WebSocket error:", error);
            this.notifyErrorListeners(error);
        };

        socket.onclose = () => {
            if (!isCurrent()) return;
            this.isOpenFlag = false;
            console.log("WebSocket disconnected");
        };
    }

    isOpen(): boolean {
        return this.isOpenFlag && this.ws.readyState === WebSocket.OPEN;
    }

    /**
     * Opens the WebSocket connection, creating a new socket if the previous
     * one has closed. Resolves once the socket is open; rejects if it closes
     * first or does not open within `timeoutMs` (an unreachable board can
     * leave a socket connecting for a very long time, which would otherwise
     * block every further retry).
     */
    async open(timeoutMs: number = 10000): Promise<void> {
        if (this.ws.readyState === WebSocket.CLOSING || this.ws.readyState === WebSocket.CLOSED) {
            this.ws = this.createSocket();
        }
        const socket = this.ws;
        const startedAt = Date.now();

        return new Promise((resolve, reject) => {
            const checkOpen = () => {
                if (socket !== this.ws) {
                    reject(new Error("WebSocket was replaced while connecting"));
                } else if (this.isOpen()) {
                    resolve();
                } else if (socket.readyState === WebSocket.CLOSING || socket.readyState === WebSocket.CLOSED) {
                    reject(new Error("WebSocket failed to connect"));
                } else if (Date.now() - startedAt >= timeoutMs) {
                    try {
                        socket.close();
                    } catch {
                        // already closing
                    }
                    reject(new Error("WebSocket connection timeout"));
                } else {
                    setTimeout(checkOpen, 100);
                }
            };
            checkOpen();
        });
    }

    /**
     * Closes the WebSocket connection (also one that is still connecting, so a
     * manual disconnect cannot leave a socket that opens afterwards)
     */
    async close(): Promise<void> {
        return new Promise((resolve) => {
            const socket = this.ws;
            if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
                const onClose = () => {
                    socket.removeEventListener("close", onClose);
                    resolve();
                };
                socket.addEventListener("close", onClose);
                socket.close();
            } else {
                resolve();
            }
        });
    }

    /**
     * Writes data to the WebSocket
     */
    async write(data: Buffer | string): Promise<void> {
        if (!this.isOpen()) {
            throw new Error("WebSocket is not connected");
        }

        const stringData = typeof data === "string" ? data : data.toString();
        this.ws.send(stringData);
        return Promise.resolve();
    }

    /**
     * Adds a data listener
     */
    addReader(listener: DataListener): () => void {
        this.dataListeners.push(listener);

        // Return unregister function
        return () => {
            this.dataListeners = this.dataListeners.filter(l => l !== listener);
        };
    }

    /**
     * Removes a specific reader
     */
    removeReader(listener: DataListener): void {
        this.dataListeners = this.dataListeners.filter(l => l !== listener);
    }

    /**
     * Adds a binary data listener (for terminal/stream data)
     */
    addBinaryReader(listener: BinaryDataListener): () => void {
        this.binaryDataListeners.push(listener);

        // Return unregister function
        return () => {
            this.binaryDataListeners = this.binaryDataListeners.filter(l => l !== listener);
        };
    }

    /**
     * Removes a specific binary reader
     */
    removeBinaryReader(listener: BinaryDataListener): void {
        this.binaryDataListeners = this.binaryDataListeners.filter(l => l !== listener);
    }

    /**
     * Notifies all listeners of incoming data
     */
    private notifyListeners(data: string): void {
        this.dataListeners.forEach(listener => {
            try {
                listener(data);
            } catch (error) {
                console.error("Error in data listener:", error);
            }
        });
    }

    /**
     * Notifies all binary data listeners
     */
    private notifyBinaryListeners(data: ArrayBuffer): void {
        this.binaryDataListeners.forEach(listener => {
            try {
                listener(data);
            } catch (error) {
                console.error("Error in binary data listener:", error);
            }
        });
    }

    /**
     * Adds an error listener
     */
    addErrorListener(listener: ErrorListener): () => void {
        this.errorListeners.push(listener);

        // Return unregister function
        return () => {
            this.errorListeners = this.errorListeners.filter(l => l !== listener);
        };
    }

    /**
     * Notifies all error listeners
     */
    private notifyErrorListeners(error: Event): void {
        this.errorListeners.forEach(listener => {
            try {
                listener(error);
            } catch (err) {
                console.error("Error in error listener:", err);
            }
        });
    }

    /**
     * Gets the native WebSocket (for advanced usage)
     */
    getNativeWebSocket(): WebSocket {
        return this.ws;
    }

    /**
     * Waits for the WebSocket to be open
     */
    async waitForConnection(timeoutMs: number = 5000): Promise<void> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error("WebSocket connection timeout"));
            }, timeoutMs);

            const checkConnection = () => {
                if (this.isOpen()) {
                    clearTimeout(timeout);
                    resolve();
                } else if (this.ws.readyState === WebSocket.CLOSED) {
                    clearTimeout(timeout);
                    reject(new Error("WebSocket connection failed"));
                } else {
                    setTimeout(checkConnection, 50);
                }
            };

            checkConnection();
        });
    }
}