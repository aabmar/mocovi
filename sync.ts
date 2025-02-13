

import { Message, Model, Store, Sync } from "./types";

let sync__: Sync | undefined;

const createSync = (
    endpoint: string,
    sessionId: string,
    getStore: (storeId: string) => Store<any> | undefined,
    getStores: () => IterableIterator<Store<any>>
): Sync => {

    const ws = new WebSocket(endpoint);

    let connected: boolean = false;
    let isReconnecting: boolean = false;

    // The store has given us callbacks we should call on events

    ws.onopen = () => {
        console.log("creasteSync() WebSocket connection opened");
        connected = true;
        isReconnecting = false;
        for (let store of getStores()) {
            sync.attach(store);
        }
    };

    ws.onmessage = (e) => {
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

        let previous = store.previousData;
        if (!previous) {
            console.error("sync: Store has no previous data: ", msg.storeId);
            return;
        }

        // Update the store with the new data

        if (!msg.payload || !Array.isArray(msg.payload)) {
            console.log("sync: No payload found in message: ", msg);
            return;

        }

        for (let model of msg.payload) {

            let existingModel = store.baseController.get(model.id);

            if (existingModel) {

                const updatedModel = { ...existingModel, ...model, synced_at: new Date() };

                // If the model from the server is newer, we update the model in the store
                if (existingModel.updated_at < updatedModel.updated_at) {
                    console.log("sync: Updating model: ", updatedModel.id);
                    store.baseController.set(updatedModel, false);
                    previous.set(updatedModel.id, { ...updatedModel });

                } else {
                    // If the model is already updated, we just set the synced_at property if missing
                    console.log("sync: Model already updated: ", updatedModel.id);
                    if (!existingModel.synced_at) {
                        existingModel.synced_at = new Date();
                        store.baseController.set(existingModel, false);
                    }
                }

            } else {
                console.log("sync: Adding new model: ", model.id);
                store.baseController.add(model, false, false);
                previous.set(model.id, { ...model });
            }
        }

        // Delete models that are in the local store, but not on the server, if they have been changed
        // If they have not been synced, they are probably new on the device and should be saved (we don't do that now).

        // Get Ids
        const localModelIds = store.baseController.getCollection().map(m => m.id);
        const serverModelIds = msg.payload.map(m => m.id);

        // Find the models that are in the local store, but not on the server
        const modelsToDelete = localModelIds.filter(id => !serverModelIds.includes(id));
        console.log(" ======= Models to check for deletion ==== ", modelsToDelete);

        for (let id of modelsToDelete) {
            const model = store.baseController.get(id);
            if (!model.synced_at && model.changed_at) continue;
            console.log("sync: Deleting model: ", id);
            store.baseController.delete(id);
            previous.delete(id);
        }

        // TODO: this must be based on ID.

        // Merge existing models with the new and updated and set it all in one operation
        // const mergedModels = [...store.baseController.getCollection(), ...newModels];
        // store.baseController.setCollection(mergedModels);

    }

    ws.onerror = (e) => {
        console.log("WebSocket error:", e);
        connected = false;

    };

    ws.onclose = (e) => {
        console.log("WebSocket connection closed:", e.code, e.reason);
        connected = false;

        for (let store of getStores()) {
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

    function getPrevious(storeId: string): Map<string, Model> {

        let store = getStore(storeId);
        if (!store) {
            console.error("sync: Store not found: ", storeId);
            return new Map<string, Model>();
        }

        let previous = store.previousData;
        if (!previous) {
            console.error("sync: Store has no previous data: ", storeId);

            previous = new Map<string, Model>();
            for (let model of store.collectionData) {
                previous.set(model.id, { ...model });
            }
        }

        return previous;
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

            if (!msg.operation) msg.operation = "set";

            if (connected) {
                let data: string;
                try {
                    data = JSON.stringify(msg);
                    ws.send(data);
                } catch (e) {
                    console.error("sync: Error sending message:", e);
                    return false;
                }
                const baseConstroller = getStore(msg.storeId)?.baseController;
                if (msg.operation === "set") {
                    let previous = getPrevious(msg.storeId);

                    for (let model of (msg.payload) as Model[]) {
                        previous.set(model.id, { ...model });
                        baseConstroller?.setField(model.id, "synced_at", new Date(), false);
                    }
                }
                return true;
            } else {
                console.log("sync: WebSocket not connected");
                return false;
            }
        },

        close: () => {
            sync__ = undefined;
            ws.close();
        },

        findChangedData: (storeId: string, data: Model[]): Model[] => {
            const previous = getPrevious(storeId);
            let updatedModels: Model[] = [];

            for (let model of data) {

                const oldModel = previous.get(model.id);
                const different = isDifferent(oldModel, model);

                if (different) {
                    updatedModels.push(model);
                }
            }

            return updatedModels;
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

function isDifferent(oldModel: { [key: string]: any } | undefined, newModel: { [key: string]: any }): boolean {
    if (!oldModel) return true;

    for (let key in newModel) {
        if (key === "id") continue;
        if (oldModel[key] !== newModel[key]) {
            return true;
        }
    }
    return false;
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
function getSync(endpoint: string, sessionId: string, getStore: (id: string) => Store<any> | undefined, getStores: () => IterableIterator<Store<any>>): Sync {

    if (sync__) {
        return sync__;
    }
    sync__ = createSync(endpoint, sessionId, getStore, getStores);
    return sync__;
}


export { getSync }