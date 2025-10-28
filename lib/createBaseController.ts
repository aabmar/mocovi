import logger, { LOG_LEVEL_DEBUG, LOG_LEVEL_INFO, setLog } from "./logger";
const { log, dbg, err, level } = logger("BaseController");
import { createStorage } from "./storage";
import { BaseController, Message, Model, NanoId, Store } from "./types";


// level(LOG_LEVEL_DEBUG);


function createBaseController<Data extends Model>(store: Store<Data>) {

    let notifyTimer: any;

    function notify() {
        store.eventHandler.notify(baseController.getCollection());
    }

    const storage = createStorage<Data>(store.id);

    const baseController: BaseController<Data> = {

        getCollection(): Data[] {
            return [...storage.values()];
        },

        getInternalStorage(): Map<string, Data> {
            return storage.getInternalStorage();
        },

        setCollection(newCollection_: Data[], source: "persist" | "sync" | false = false) {

            dbg("SET[]: ", store.id, newCollection_.length, source)

            // If we have sync with "set", or "auto", we keep changed models
            const fromSync = source === "sync";
            const fromPersist = source === "persist";

            let newCollection = newCollection_

            // Should we overwrite models that are in the collection and have changed?
            let deleteChanged = fromSync && store.syncMode === "get";
            dbg("setCollection() ", store.id, " - deleteChanged: ", deleteChanged, store.syncMode);

            const skipMarking = fromPersist;

            if (storage.setArray(newCollection_, skipMarking, deleteChanged)) {

                notify();

            }
        },

        get(modelId: string | undefined): Data | null {
            if (!modelId) return null;
            return storage.get(modelId) || null;
        },

        getField(modelId: string, key: keyof Data) {
            const model = baseController.get(modelId);
            return model ? model[key] : null;
        },


        // Set one existing model to the collection. The model will be overwritten, not merged.
        // Todo: support array of models? Or maybe make a setModels or updateCollection instead? Goal: less calls to setCollection
        set(model: Data, markChanged = true) {

            dbg("SET: ", store.id, model, markChanged);

            // Normally we need to mark the the model as updated due to sync
            if (markChanged) {
                dbg("set() Marking change.");
                model.changed_at = Date.now();
            }

            // Store
            const wasDifferent = storage.set(model);

            if (wasDifferent) {
                log("set() ", store.id, model.id, " - was different - NOTIFYING");
                notify();
            }

        },

        setField(modelId: string, key: keyof Data, value: any, markChanged = true) {

            dbg("SET FIELD: ", store.id, modelId, key, value, markChanged);

            const oldModel = storage.get(modelId);
            if (!oldModel) return false;

            store.baseController.set({ ...oldModel, [key]: value }, markChanged);
        },

        clear() {
            log("CLEAR: ", store.id);
            if (store.persist) {
                store.persist.set(store.id, "[]");
            }
            storage.clear();
            notify();

        },

        delete(modelId: string) {
            log("DELETE: ", store.id, modelId);

            // Delete
            storage.delete(modelId);

            notify();

        },

        fetchCollection() {
            if (store.sync) {
                // Send a get data message
                const message: Message = {
                    storeId: store.id,
                    operation: "list",
                    payload: []
                }
                store.sync.send(message);
            }
        },

        fetchModel(id: NanoId) {
            const models = [{ id }];

            if (store.sync) {
                // Send a get data message
                const message: Message = {
                    storeId: store.id,
                    operation: "get",
                    payload: models
                }
                store.sync.send(message);
            }
        },

        fetchSearch(query: { [key: string]: string }) {
            if (store.sync) {
                // Send a search message
                const message: Message = {
                    storeId: store.id,
                    operation: "search",
                    payload: [query]
                }
                store.sync.send(message);
            }
        },

        __getAndResetChanges() {
            return storage.getAndResetChange();
        },

        size() {
            return storage.size();
        },

        getFirst() {
            return storage.getFirst() || null;
        },

        getLast() {
            return storage.getLast() || null;
        },

        getNewest() {
            return storage.getNewest() || null;
        },
        getOldest() {
            return storage.getOldest() || null;
        },

        has(modelId: string) {
            return storage.has(modelId);
        },

        subscribe(callback: (data: Data[]) => void) {
            store.eventHandler.subscribe(callback);
            return callback;
        },

        unsubscribe(callback: (data: Data[]) => void) {
            store.eventHandler.unsubscribe(callback);
        }

    };

    return baseController;
}

export default createBaseController
