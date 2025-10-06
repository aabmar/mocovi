import useLog, { LOG_LEVEL_DEBUG } from "./logger";
const { log, err, dbg, level } = useLog("sync");

// level(LOG_LEVEL_DEBUG);

import { ChangeEntry, Message, Store, Sync } from "./types";

const sync = (
    endpoint: string,
    sessionId: string,
    getStore: (storeId: string) => Store<any> | undefined,
    getStores: () => Map<string, Store<any>>,
    notAuthorizedCallback?: () => void,
    onClose?: () => void // Use this to reconnect. It will not be called if you call sync.close()
): Sync => {


    (window as any).inscance_ = ((window as any).inscance_ || 0) + 1;
    const instance = (window as any).inscance_;

    dbg("startSync() endpoint: ", endpoint, "sessionId: ", sessionId, "instance: ", instance);
    const ws = new WebSocket(endpoint);

    let pingCount = 0;
    let doPing = true;
    let pingTimer: any;
    let attachTimer: any;

    function ping() {
        ws.send("ping");
        log("Ping sent: ", instance, pingCount++);
        if (doPing) {
            pingTimer = setTimeout(ping, 10000);
        }
    }

    // The store has given us callbacks we should call on events

    ws.onopen = () => {
        log("WebSocket connection opened: ", endpoint);

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
            msg.operation, msg.cmd ? "cmd:" + msg.cmd : "", "payload type: ", typeof msg.payload,
            " count: " + msg.payload?.length || 0, " error: " + msg.error_code || ""
        );
        dbg("Message from server:", msg); // HACK: TODO: Remember to switch this back to dbg

        // Check if the session id is the same as the current session
        if (msg.sessionId !== sessionId) {
            log("Session id mismatch, ignoring message. Message: ", msg.sessionId, "Session: ", sessionId);

            if (msg.error_code === 401 && notAuthorizedCallback) {
                notAuthorizedCallback();
            }
            return;
        }

        const store = getStore(msg.storeId) as Store<any>;
        if (!store) {
            err("Store not found: ", msg.storeId);
            return;
        }

        // If this is a message, not data, we call listeners
        // if (msg.operation === "broadcast" || msg.operation === "direct") {
        if (msg.operation) {
            dbg("sync: ===== Notifying listeners: ", msg.storeId, msg.operation, msg.cmd, msg.payload);
            for (let [callback, key] of store.subscribesTo) {
                dbg("broadcast/direct Callback ", store.id, key);
                callback(msg);
            }
            if (msg.operation === "broadcast" || msg.operation === "direct" || msg.operation === "cmd") {
                return;
            }
        }

        if (msg.operation === "subscribed") {
            log("sync: Subscription confirmed: ", msg.storeId);
            return;
        }

        // Update the store with the new data if operation is "response" or "update"

        if (!msg.payload || !Array.isArray(msg.payload)) {
            log("sync: No payload found in message: ", msg);
            return;
        }

        // Response. Replace the collection with the new data
        if (msg.operation === "response") {

            dbg("!!!!!!!!!!!!!!!!! Setting collection RESPONSE: ", msg.storeId, msg.operation, msg.payload?.length);
            // If not handled, it is a data operation

            store.baseController.setCollection(msg.payload, "sync");
        }

        // Update. Only set the models in the payload, not replace the collection
        if (msg.operation === "update") {

            dbg("!!!!!!!!!!!!!!!!! Setting collection UPDATE: ", msg.storeId, msg.operation, msg.payload?.length);

            // We are not going to replace the collection, just update the models
            // If not handled, it is a data operation

            for (let i = 0; i < msg.payload.length; i++) {
                const model = msg.payload[i];
                store.baseController.set(model, false);
            }

        }
    }

    // Event on error
    ws.onerror = (e) => {
        dbg("WebSocket error:", e);
        ws.close();
    };

    // Event when the connection is closed
    ws.onclose = (e) => {
        log("WebSocket connection closed:", e.code, e.reason);

        // Stop ping and any pending attach
        doPing = false;
        if (pingTimer) {
            clearTimeout(pingTimer);
            pingTimer = undefined;
        }
        if (attachTimer) {
            clearTimeout(attachTimer);
            attachTimer = undefined;
        }

        for (let store of getStores().values()) {
            if (store.sync) {
                store.sync = undefined;
            }
        }

        // Call the callback if we got any. This will normally be set up to try to reconnect
        if (onClose) {
            onClose();
        }
    }

    // The object we send back to the Store
    let sync: Sync = {
        send: (msg: Message): boolean => {
            log("sync: Sending message: ", msg.operation, msg.storeId, typeof msg.payload);

            if (!msg.operation) throw new Error("sync: No operation in message");

            // Assign the session id to the message
            msg.sessionId = sessionId;

            let data: string;
            try {
                data = JSON.stringify(msg);
                ws.send(data);
            } catch (e) {
                err("sync: Error sending message:", e);
                return false;
            }
            return true;
        },

        sendChanges: (store: Store<any>, changes: ChangeEntry): boolean => {

            const combined = [...changes.inserted, ...changes.updated];

            // filter out only models with changed_at set
            const models = combined.filter((model) => model.changed_at);

            dbg("sendChanged: CHANGED: ", models);
            const storeId = changes.storeId;

            // Send over new and changed models
            if (models.length > 0) {
                dbg(storeId, " sending SET message: ", models.length);
                const message: Message = {
                    storeId,
                    operation: "set",
                    sessionId: sessionId,
                    payload: models
                }

                // Todo: we are going to batch messages from different models here (?)
                const ret = sync.send(message);
                if (ret) {
                    for (let model of models) {
                        model.changed_at = undefined;
                        store.baseController.set(model, false);
                    }
                }
            }

            const deleted = changes.deleted.map((model) => ({ id: model.id }));
            const payload = deleted.map((model) => ({ id: model.id }));

            if (deleted.length > 0) {
                dbg(storeId, " sending DELETE message: ", deleted.length);
                const message: Message = {
                    storeId,
                    operation: "delete",
                    sessionId: sessionId,
                    payload: payload
                };

                return sync.send(message);
            }
            return false;
        },

        // Call this to close the connection. The onClose callback will not be called then.
        close: () => {
            onClose = undefined;
            ws.close();
        },

        // Attach the sync object to the store and set up sync if needed
        // The actual attachment will be done after a short delay to allow for multiple stores to be added at once
        attach: (store: Store<any>) => {
            dbg("store.syncMode", store.id, store.syncMode);

            if ((store.syncMode)) {
                store.sync = sync;

                attachTimer = setTimeout(() => {
                    store.resubscribe();

                    if (store.syncMode === "auto" || store.syncMode === "get") {
                        dbg("sync ws.onopen: store.fetch()", store.id);
                        store.mergedController.fetch();
                    }
                }, 1000);
            }
        },

        // Subscribe to a topic from the server.
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

        // Unsubscribe from a topic.
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

export default sync;
