import { ChangeEntry, Message, Model, Store, Sync } from "./types";

let sync__: Sync | undefined;

const createSync = (
    endpoint: string,
    sessionId: string,
    getStore: (storeId: string) => Store<any> | undefined,
    getStores: () => Map<string, Store<any>>
): Sync => {

    const ws = new WebSocket(endpoint);

    let connected: boolean = false;
    let isReconnecting: boolean = false;

    // The store has given us callbacks we should call on events

    ws.onopen = () => {
        console.log("creasteSync() WebSocket connection opened");
        connected = true;
        isReconnecting = false;
        for (let store of getStores().values()) {
            sync.attach(store);
        }
    };

    ws.onmessage = async (e) => {
        if (!e.data) return;
        let msg;
        try {
            msg = JSON.parse(e.data) as Message;
        } catch (e) {
            console.error("Error parsing message:", e);
            return;
        }
        console.log("====== ", msg.storeId, " ==== Message from server:", e.data);

        // Check if the session id is the same as the current session
        if (msg.sessionId !== sessionId) {
            console.log("Session id mismatch, ignoring message");
            return;
        }

        const store = getStore(msg.storeId) as Store<any>;
        if (!store) {
            console.error("Store not found: ", msg.storeId);
            return;
        }

        // Update the store with the new data

        if (!msg.payload || !Array.isArray(msg.payload)) {
            console.log("sync: No payload found in message: ", msg);
            return;

        }

        // TODO: Check operation field in message
        store.baseController.setCollection(msg.payload, true);

    }

    ws.onerror = (e) => {
        console.log("WebSocket error:", e);
        connected = false;
    };

    ws.onclose = (e) => {
        console.log("WebSocket connection closed:", e.code, e.reason);
        connected = false;

        for (let store of getStores().values()) {
            if (store.sync) {
                store.sync = undefined;
            }
        }

        if (sync__) {
            sync__ = undefined;
            reconnect();
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
            console.log("sync: Sending message: ", msg.storeId, msg.operation, typeof msg.payload);
            if (!connected) {
                reconnect(() => {
                    sync.send(msg);
                });
                return true;
            }

            if (!msg.operation) throw new Error("sync: No operation in message");

            if (connected) {
                let data: string;
                try {
                    data = JSON.stringify(msg);
                    ws.send(data);
                } catch (e) {
                    console.error("sync: Error sending message:", e);
                    return false;
                }
                return true;
            } else {
                console.log("sync: WebSocket not connected");
                return false;
            }
        },
        sendChanges: (changes: ChangeEntry): boolean => {

            const models = [...changes.inserted, ...changes.updated];
            const storeId = changes.storeId;

            // Send over new and changed models
            if (models.length > 0) {
                console.log("createStore() ", storeId, " sending SET message: ", models.length);
                const message: Message = {
                    storeId,
                    operation: "set",
                    sessionId: sync.sessionId,
                    payload: models
                }

                // Todo: we are going to batch messages from different models here (?)
                return sync.send(message);
            }

            const deleted = changes.deleted.map((model) => ({ id: model.id }));

            if (deleted.length > 0) {
                console.log("createStore() ", storeId, " sending DELETE message: ", deleted.length);
                const message: Message = {
                    storeId,
                    operation: "delete",
                    sessionId: sync.sessionId,
                    payload: deleted
                }
                return sync.send(message);
            }
        },

        close: () => {
            sync__ = undefined;
            ws.close();
        },

        attach: (store: Store<any>) => {
            console.log("sync ws.onopen: store.syncMode", store.id, store.syncMode);
            if ((store.syncMode)) {
                store.sync = sync;

                if (store.syncMode === "auto" || store.syncMode === "get") {
                    console.log("sync ws.onopen: store.fetch()", store.id);
                    store.mergedController.fetch();
                }
            }
        },

        sessionId
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


export { getSync }