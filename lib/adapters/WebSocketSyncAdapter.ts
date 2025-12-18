import { Model, SyncAdapter, Message } from "../types";
import useLog from "../logger";

const { log, err, dbg } = useLog("WebSocketSyncAdapter");

export type WebSocketSyncAdapterOptions = {
    endpoint: string;
    sessionId: string;
    onError?: (error: Event) => void;
    onUnauthorized?: () => void;
    onReconnect?: () => void;
    pingInterval?: number;
};

export function createWebSocketSyncAdapter(options: WebSocketSyncAdapterOptions): SyncAdapter {
    const {
        endpoint,
        sessionId,
        onError,
        onUnauthorized,
        onReconnect,
        pingInterval = 10000
    } = options;

    let ws: WebSocket | null = null;
    let pingTimer: any = null;
    let doPing = false;
    const subscriptions = new Map<string, Set<(msg: Message) => void>>();

    function ping() {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send("ping");
            log("Ping sent");
            if (doPing) {
                pingTimer = setTimeout(ping, pingInterval);
            }
        }
    }

    function startPing() {
        doPing = true;
        if (pingTimer) clearTimeout(pingTimer);
        ping();
    }

    function stopPing() {
        doPing = false;
        if (pingTimer) {
            clearTimeout(pingTimer);
            pingTimer = null;
        }
    }

    function send(msg: Message): boolean {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            err("WebSocket not connected");
            return false;
        }

        msg.sessionId = sessionId;

        try {
            const data = JSON.stringify(msg);
            ws.send(data);
            log("Message sent:", msg.operation, msg.storeId);
            return true;
        } catch (e) {
            err("Error sending message:", e);
            return false;
        }
    }

    const adapter: SyncAdapter = {
        async connect(): Promise<void> {
            return new Promise((resolve, reject) => {
                log("Connecting to WebSocket:", endpoint);

                ws = new WebSocket(endpoint);

                ws.onopen = () => {
                    log("WebSocket connected");
                    startPing();
                    resolve();
                };

                ws.onerror = (e) => {
                    err("WebSocket error:", e);
                    if (onError) onError(e);
                    reject(e);
                };

                ws.onmessage = async (e) => {
                    if (!e.data) return;

                    let msg: Message;
                    try {
                        msg = JSON.parse(e.data) as Message;
                    } catch (err_) {
                        err("Error parsing message:", err_);
                        return;
                    }

                    log("Message received:", msg.operation, msg.storeId);
                    dbg("Message details:", msg);

                    // Check session ID
                    if (msg.sessionId !== sessionId) {
                        log("Session ID mismatch, ignoring message");
                        if (msg.error_code === 401 && onUnauthorized) {
                            onUnauthorized();
                        }
                        return;
                    }

                    // Notify subscribers
                    const callbacks = subscriptions.get(msg.storeId);
                    if (callbacks) {
                        for (const callback of callbacks) {
                            callback(msg);
                        }
                    }
                };

                ws.onclose = (e) => {
                    log("WebSocket closed:", e.code, e.reason);
                    stopPing();
                    ws = null;

                    if (onReconnect) {
                        onReconnect();
                    }
                };
            });
        },

        disconnect(): void {
            log("Disconnecting WebSocket");
            stopPing();

            if (ws) {
                ws.close();
                ws = null;
            }

            subscriptions.clear();
        },

        async fetchCollection(storeId: string): Promise<Model[]> {
            return new Promise((resolve, reject) => {
                const msg: Message = {
                    storeId,
                    operation: "get",
                    payload: []
                };

                // Subscribe temporarily to get the response
                const callback = (response: Message) => {
                    if (response.operation === "response" && Array.isArray(response.payload)) {
                        adapter.unsubscribe?.(storeId, callback);
                        resolve(response.payload);
                    }
                };

                adapter.subscribe?.(storeId, callback);

                if (!send(msg)) {
                    adapter.unsubscribe?.(storeId, callback);
                    reject(new Error("Failed to send fetch request"));
                }

                // Timeout after 30 seconds
                setTimeout(() => {
                    adapter.unsubscribe?.(storeId, callback);
                    reject(new Error("Fetch timeout"));
                }, 30000);
            });
        },

        async fetchById(storeId: string, ids: string[]): Promise<Model[]> {
            return new Promise((resolve, reject) => {
                const msg: Message = {
                    storeId,
                    operation: "get",
                    payload: ids.map(id => ({ id }))
                };

                const callback = (response: Message) => {
                    if (response.operation === "response" && Array.isArray(response.payload)) {
                        adapter.unsubscribe?.(storeId, callback);
                        resolve(response.payload);
                    }
                };

                adapter.subscribe?.(storeId, callback);

                if (!send(msg)) {
                    adapter.unsubscribe?.(storeId, callback);
                    reject(new Error("Failed to send fetch by ID request"));
                }

                setTimeout(() => {
                    adapter.unsubscribe?.(storeId, callback);
                    reject(new Error("Fetch by ID timeout"));
                }, 30000);
            });
        },

        async create(storeId: string, models: Model[]): Promise<void> {
            const msg: Message = {
                storeId,
                operation: "set",
                payload: models
            };

            if (!send(msg)) {
                throw new Error("Failed to send create request");
            }
        },

        async update(storeId: string, models: Model[]): Promise<void> {
            const msg: Message = {
                storeId,
                operation: "set",
                payload: models
            };

            if (!send(msg)) {
                throw new Error("Failed to send update request");
            }
        },

        async delete(storeId: string, ids: string[]): Promise<void> {
            const msg: Message = {
                storeId,
                operation: "delete",
                payload: ids.map(id => ({ id }))
            };

            if (!send(msg)) {
                throw new Error("Failed to send delete request");
            }
        },

        subscribe(storeId: string, callback: (msg: Message) => void): void {
            if (!subscriptions.has(storeId)) {
                subscriptions.set(storeId, new Set());

                // Send subscribe message to server
                const msg: Message = {
                    storeId,
                    operation: "subscribe",
                    payload: []
                };
                send(msg);
            }

            subscriptions.get(storeId)!.add(callback);
            log("Subscribed to:", storeId);
        },

        unsubscribe(storeId: string, callback: (msg: Message) => void): void {
            const callbacks = subscriptions.get(storeId);
            if (callbacks) {
                callbacks.delete(callback);

                if (callbacks.size === 0) {
                    subscriptions.delete(storeId);

                    // Send unsubscribe message to server
                    const msg: Message = {
                        storeId,
                        operation: "unsubscribe",
                        payload: []
                    };
                    send(msg);
                }
            }
            log("Unsubscribed from:", storeId);
        },

        sendCommand(storeId: string, cmd: string, payload?: any): void {
            const msg: Message = {
                storeId,
                operation: "cmd",
                cmd,
                payload: payload || []
            };
            send(msg);
        }
    };

    return adapter;
}
