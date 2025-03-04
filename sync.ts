import useLog, { LOG_LEVEL_INFO, setLog } from "./logger";
const { log, err, dbg } = useLog("sync");

setLog("sync", LOG_LEVEL_INFO);

import { ChangeEntry, Message, Store, Sync } from "./types";

let sync__: Sync | undefined;

const createSync = (
    endpoint: string,
    sessionId: string,
    getStore: (storeId: string) => Store<any> | undefined,
    getStores: () => Map<string, Store<any>>
): Sync => {
    (window as any).inscance_ = ((window as any).inscance_ || 0) + 1;
    const instance = (window as any).inscance_;
    dbg("createSync() endpoint: ", endpoint, "sessionId: ", sessionId, "instance: ", instance);
    const ws = new WebSocket(endpoint);

    let connected: boolean = false;
    let isReconnecting: boolean = false;
    let pingCount = 0;
    let doReconnect = true;

    function ping() {
        if (!connected) return;
        // ws.ping();
        ws.send("ping");
        log("Ping sent: ", instance, pingCount++);


        if ((window as any).inscance_ !== instance) {
            log("We found duplicate instance, closing this one");
            doReconnect = false;
            ws.close();
            return;
        }
        setTimeout(ping, 10000);
    }

    // The store has given us callbacks we should call on events

    ws.onopen = () => {
        log("WebSocket connection opened");
        connected = true;
        isReconnecting = false;
        for (let store of getStores().values()) {
            sync.attach(store);
        }
        ping();
    };

    ws.onmessage = async (e) => {
        if (!e.data) return;
        let msg;
        try {
            msg = JSON.parse(e.data) as Message;
        } catch (e) {
            err("Error parsing message:", e);
            return;
        }
        log("====== ", msg.storeId, " ==== Message from server:",
            msg.operation, "cmd:", msg.cmd, "payload type: ", typeof msg.payload,
            msg.payload?.length ? msg.payload.length : "", msg
        );
        dbg("Message from server:", msg);

        // Check if the session id is the same as the current session
        if (msg.sessionId !== sessionId) {
            log("Session id mismatch, ignoring message");
            return;
        }

        const store = getStore(msg.storeId) as Store<any>;
        if (!store) {
            err("Store not found: ", msg.storeId);
            return;
        }

        // If this is a message, not data, we call listeners
        if (msg.operation === "broadcast" || msg.operation === "direct") {
            dbg("sync: ===== Notifying listeners: ", msg.storeId, msg.operation, msg.cmd, msg.payload);
            for (let [callback, key] of store.subscribesTo) {
                dbg("broadcast/direct Callback ", store.id, key);
                callback(msg);
            }
            return;
        }

        if (msg.operation === "subscribed") {
            log("sync: Subscription confirmed: ", msg.storeId);
            return;
        }

        // Update the store with the new data
        if (!msg.payload || !Array.isArray(msg.payload)) {
            log("sync: No payload found in message: ", msg);
            return;
        }

        dbg("!!!!!!!!!!!!!!!!! Setting collection: ", msg.storeId, msg.operation, msg.payload?.length);
        // If not handled, it is a data operation

        store.baseController.setCollection(msg.payload, "sync");

    }

    ws.onerror = (e) => {
        dbg("WebSocket error:", e);
        connected = false;
    };

    ws.onclose = (e) => {
        log("WebSocket connection closed:", e.code, e.reason);
        connected = false;

        for (let store of getStores().values()) {
            if (store.sync) {
                store.sync = undefined;
            }
        }

        if (sync__) {
            sync__ = undefined;
            if (doReconnect) reconnect();
        }
    }

    function reconnect(cb?: () => void) {
        if (isReconnecting) return;
        isReconnecting = true;
        setTimeout(() => {
            sync__ = createSync(endpoint, sessionId, getStore, getStores);
            if (cb) cb();
        }, 5000);
    }

    // The objec we send back to the Store
    let sync: Sync = {
        send: (msg: Message): boolean => {
            log("sync: Sending message: ", msg.operation, msg.storeId, typeof msg.payload);
            if (!connected) {
                reconnect(() => {
                    sync.send(msg);
                });
                return true;
            }

            if (!msg.operation) throw new Error("sync: No operation in message");

            // Assign the session id to the message
            msg.sessionId = sessionId;

            if (connected) {
                let data: string;
                try {
                    data = JSON.stringify(msg);
                    ws.send(data);
                } catch (e) {
                    err("sync: Error sending message:", e);
                    return false;
                }
                return true;
            } else {
                log("sync: WebSocket not connected");
                return false;
            }
        },
        sendChanges: (changes: ChangeEntry): boolean => {

            const models = [...changes.inserted, ...changes.updated];
            const storeId = changes.storeId;

            // Send over new and changed models
            if (models.length > 0) {
                dbg("createStore() ", storeId, " sending SET message: ", models.length);
                const message: Message = {
                    storeId,
                    operation: "set",
                    sessionId: sessionId,
                    payload: models
                }

                // Todo: we are going to batch messages from different models here (?)
                return sync.send(message);
            }

            const deleted = changes.deleted.map((model) => ({ id: model.id }));

            if (deleted.length > 0) {
                dbg("createStore() ", storeId, " sending DELETE message: ", deleted.length);
                const message: Message = {
                    storeId,
                    operation: "delete",
                    sessionId: sessionId,
                    payload: deleted
                };

                return sync.send(message);
            }
            return false;
        },

        close: () => {
            sync__ = undefined;
            ws.close();
        },

        attach: (store: Store<any>) => {
            dbg("store.syncMode", store.id, store.syncMode);

            if ((store.syncMode)) {
                store.sync = sync;

                setTimeout(() => {
                    store.resubscribe();

                    if (store.syncMode === "auto" || store.syncMode === "get") {
                        dbg("sync ws.onopen: store.fetch()", store.id);
                        // TODO: HACK: This should be here.
                        // store.mergedController.fetch();
                    }
                }, 1000);
            }
        },

        subscribe: (topic: string, callback: (msg: Message) => void) => {
            const message: Message = {
                storeId: topic,
                operation: "subscribe",
                sessionId: sessionId,
                payload: []
            };

            dbg("sync: Subscribing to topic: ", topic, message);
            return sync.send(message);

        },

        unsubscribe: (topic: string, callback: (msg: Message) => void) => {
            dbg("sync: Unsubscribing from topic: ", topic);
            const message: Message = {
                storeId: topic,
                operation: "unsubscribe",
                sessionId: sessionId,
                payload: []
            };

            return sync.send(message);
        }
    }

    return sync;

}

/**
 * Gets the Sync instance for the given endpoint and session ID.
 * 
 * @param endpoint - The endpoint to connect to.
 * @param sessionId - The session identifier.
 * @param getStore - Function to retrieve a specific store based on its ID.
 * @param getStores - Function to retrieve an iterable of all stores.
 * @returns The Sync instance.
 */
function getSync(endpoint: string, sessionId: string, getStore: (id: string) => Store<any> | undefined, getStores: () => Map<string, Store<any>>): Sync {

    if (sync__) {
        return sync__;
    }
    sync__ = createSync(endpoint, sessionId, getStore, getStores);
    return sync__;
}


export { getSync };
