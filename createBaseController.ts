import useLog, { LOG_LEVEL_DEBUG, LOG_LEVEL_INFO, setLog } from "./logger";
const { log, dbg, err, level } = useLog("createBaseController");
import { createStorage } from "./storage";
import { BaseController, Message, Model, Store } from "./types";


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

        setCollection(newCollection_: Data[], source: "persist" | "sync" | false = false) {

            dbg("SET[]: ", store.id, newCollection_.length, source)

            // If we have sync with "set", or "auto", we keep changed models
            const fromSync = source === "sync";
            const fromPersist = source === "persist";

            let newCollection = newCollection_;

            let deleteChanged = fromSync && store.syncMode === "get";
            dbg("setCollection() ", store.id, " - deleteChanged: ", deleteChanged, store.syncMode);

            const skipMarking = fromPersist;

            if (storage.setArray(newCollection_, skipMarking, deleteChanged)) {

                // If the collection is empty, set selectedModelId to null
                if (storage.size() === 0) {
                    dbg("BaseController: setCollection() empty collection, deselecting", store.id);
                    store.selectedModelId = null;
                }

                // If the selected is no longer in the collection, remove selection
                if (store.selectedModelId && !storage.has(store.selectedModelId)) {
                    dbg(`BaseController: setCollection() ${store.id} selected model (${store.selectedModelId}) no longer in collection, deselecting`);
                    store.selectedModelId = null;
                }

                // If autoSelect is enabled, and no model is selected, select the first model
                if (store.autoSelect && !store.selectedModelId && storage.size() > 0) {
                    const firstModel = storage.getLast();
                    if (firstModel) {
                        store.selectedModelId = firstModel.id;
                        dbg(`BaseController: setCollection() ${store.id} auto-selected model (${store.selectedModelId})`);
                    }
                }
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

        getSelected(): Data | null {
            if (!store.selectedModelId) return null;
            return baseController.get(store.selectedModelId);
        },

        getSelectedId(): string | null {
            return store.selectedModelId;
        },

        // Set one existing model to the collection. The model will be overwritten, not merged.
        // Todo: support array of models? Or maybe make a setModels or updateCollection instead? Goal: less calls to setCollection
        set(model: Data, select: "no" | "if_empty" | "yes" = "no", markChanged = true) {

            dbg("SET: ", store.id, model, select, markChanged);

            // Normally we need to mark the the model as updated due to sync
            if (markChanged) {
                dbg("set() Marking change.");
                model.changed_at = Date.now();
            }

            // Store
            const wasDifferent = storage.set(model);

            // Should we set this model as selected?
            if (select === "yes" || store.autoSelect) {
                baseController.select(model.id);
            } else if (select === "if_empty" && storage.size() === 0) {
                baseController.select(model.id);
            }
            if (wasDifferent) {
                log("set() ", store.id, model.id, " - was different - NOTIFYING");
                notify();
            }

        },

        setField(modelId: string, key: keyof Data, value: any, markChanged = true) {

            dbg("SET FIELD: ", store.id, modelId, key, value, markChanged);

            const oldModel = storage.get(modelId);
            if (!oldModel) return false;

            store.baseController.set({ ...oldModel, [key]: value }, "no", markChanged);
        },

        clear() {
            log("CLEAR: ", store.id);
            if (store.persist) {
                store.persist.set(store.id, "[]");
            }
            storage.clear();
            notify();

            baseController.select(null);
        },

        delete(modelId: string) {
            log("DELETE: ", store.id, modelId);

            // Delete
            storage.delete(modelId);

            // Handle selected
            if (store.selectedModelId === modelId) {
                if (store.autoSelect) {
                    baseController.select(true);
                } else {
                    baseController.select(null);
                }
            }
            notify();

        },

        // ID of the model to select. If null, deselect. If true, select the last model.
        select(modelId: string | null | true): null | Data {
            dbg("BaseController: select() ", store.id, modelId);

            if (store.selectedModelId === modelId) {
                return null;
            }

            if (!modelId) {
                store.selectedModelId = null;
                notify();
                return null;
            } else if (modelId === true) {
                // Return last model
                const last = storage.getLast();  // Assuming you have a method to get the last model
                if (last) {
                    store.selectedModelId = last.id;
                    notify();
                    return last;
                } else {
                    return null;
                }
            } else if (!storage.has(modelId)) {
                return null;
            }

            store.selectedModelId = modelId;
            notify();
            return storage.get(modelId);
        },

        fetch(id?: string | string[] | [{ id: string }]) {

            // If not id, let it be an empty array. If its a string, an array with one string. Else, its an array of strings.
            let models: Model[];
            if (!id) {
                models = [];
            } else if (typeof id === "string") {
                models = [{ id }];
            } else if (Array.isArray(id) && id.length > 0 && typeof id[0] === 'object') {
                models = id as [{ id: string }];
            } else if (Array.isArray(id)) {
                models = (id as string[]).map((id: string) => ({ id }));
            }

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
