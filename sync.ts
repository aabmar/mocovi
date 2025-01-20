
import { Message, Model, Store, Sync, getStore } from "./Store";

let sync__: Sync | undefined;

const createSync = (
    endpoint: string,
    sessionId: string,
    stores: Map<string, Store<any>>,
): Sync => {

    const ws = new WebSocket(endpoint);

    let connected: boolean = false;
    let isReconnecting: boolean = false;

    // The store has given us callbacks we should call on events

    ws.onopen = () => {
        console.log("WebSocket connection opened");
        // to send message you can use like that :   ws.send("Hello, server!"); 
        connected = true;
        isReconnecting = false;
        for (let store of stores.values()) {
            if (store?.syncCallback) {
                store.sync = sync;

                // Send a get data message
                const message: Message = {
                    storeId: store.id,
                    operation: "get",
                    sessionId: sync.sessionId,
                    models: []
                }
                store.sync.send(message);
            }
        }
    };

    ws.onmessage = (e) => {
        console.log("Message from server:", e.data);
        if (!e.data) return;
        let msg;
        try {
            msg = JSON.parse(e.data) as Message;
        } catch (e) {
            console.error("Error parsing message:", e);
            return;
        }

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

        // // Update the store with the new data
        // const newModels: Model[] = [];
        // if (newModels.length === 0) return;

        for (let model of msg.models) {

            let existingModel = store.baseController.get(model.id);

            if (existingModel) {
                const updatedModel = { ...existingModel, ...model };
                if (existingModel.updated_at < updatedModel.updated_at) {
                    console.log("sync: Updating model: ", updatedModel.id);
                    store.baseController.set(updatedModel);
                    previous.set(updatedModel.id, updatedModel);
                    // newModels.push(updatedModel);
                } else {
                    console.log("sync: Model already updated: ", updatedModel.id);
                }
            } else {
                console.log("sync: Adding new model: ", model.id);
                store.baseController.add(model);
                // newModels.push(model);
                previous.set(model.id, model);
            }
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

        stores.forEach((store) => {
            if (store.sync) {
                store.sync = undefined;
            }
        });

        if (sync__) {
            sync__ = undefined;
            reconnect();
        }
    }

    function reconnect(cb?: () => void) {
        if (isReconnecting) return;
        isReconnecting = true;
        setTimeout(() => {
            sync__ = createSync(endpoint, sessionId, stores);
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
            previous = new Map<string, Model>();
            store.previousData = previous;
        }
        return previous;
    }

    // The objec we send back to the Store
    let sync: Sync = {
        send: (msg: Message): boolean => {
            console.log("sync: Sending message: ", msg.storeId, msg.operation, msg.models.length);
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

                let previous = getPrevious(msg.storeId);

                for (let model of msg.models) {
                    previous.set(model.id, model);
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
                if (oldModel !== model) {
                    updatedModels.push(model);
                }
            }

            return updatedModels;
        },

        sessionId
    };

    // Set sync to stores that have syncCallback


    return sync;

};

function getSync(endpoint: string, sessionId: string, stores: Map<string, Store<any>>,): Sync {

    if (sync__) {
        return sync__;
    }
    sync__ = createSync(endpoint, sessionId, stores);
    return sync__;
}

export { getSync };