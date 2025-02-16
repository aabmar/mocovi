import { Message, Model, Store, Sync } from "./types";

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

        // TODO: Check operation field in message

        // Iterate over the incomming models
        for (let incommingModel of msg.payload) {

            if (!incommingModel.created_at) {
                console.error("sync: =================================== Model has no created_at field: ", incommingModel);
                continue;
            }
            let localModel = store.baseController.get(incommingModel.id);
            const different = isDifferent(localModel, incommingModel);


            // If no local model, we add it
            if (!localModel) {
                console.log("sync: Adding new model: ", incommingModel.id);
                store.baseController.add(incommingModel, "if_empty", false);
                previous.set(incommingModel.id, { ...incommingModel });
                continue;
            }

            // If incomming is newer, we update the local model
            const incommingChangedTime = incommingModel.changed_at;
            const localUpdatedTime = localModel.updated_at || localModel.changed_at;
            const incommingIsNewer = incommingChangedTime > (localUpdatedTime || 0);

            if (different && incommingIsNewer) {
                console.log("sync: on message: updating model: ", store.id, incommingModel.id, "is different: ", different, "incommingIsNewer: ", incommingIsNewer, "incommingChangedTime: ", incommingChangedTime, "localUpdatedTime: ", localUpdatedTime);

                const updatedModel = {
                    ...localModel,
                    ...incommingModel,
                    synced_at: Date.now()
                };
                if (updatedModel.changed_at) delete updatedModel.changed_at;

                store.baseController.set(updatedModel, false);
                previous.set(updatedModel.id, { ...updatedModel });
                continue;
            } else {
                // If the model is already updated, we just set the synced_at property if missing
                console.log("sync: on message: Model up to date: ", store.id, incommingModel.id, "is different: ", different, "incommingIsNewer: ", incommingIsNewer, "incommingChangedTime: ", incommingChangedTime, "localUpdatedTime: ", localUpdatedTime);

                // Make sure all timestamps are correct.
                if (!localModel.synced_at || !localModel.created_at || !localModel.updated_at || localModel.changed_at) {
                    localModel.synced_at = Date.now();
                    localModel.created_at = incommingModel.created_at;
                    localModel.updated_at = incommingModel.updated_at;
                    delete localModel.changed_at;
                    console.log("sync: on message: Model up to date, set syncedAt: ", store.id, incommingModel.id, localModel.synced_at);
                    store.baseController.set(localModel, false);
                }
                continue;
            }

            console.log("sync: on message: model not changed: ", store.id, incommingModel.id);

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
            if ((!model.synced_at && model.changed_at) || (model.id === "0" || model.id === "1")) continue;
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
                        baseConstroller?.setField(model.id, "synced_at", Date.now(), false);
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