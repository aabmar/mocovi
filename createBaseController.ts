import { createStorage } from "./storage";
import { BaseController, Message, Model, Store } from "./types";

function createBaseController<Data extends Model>(store: Store<Data>) {

    let notifyTimer: any;

    function notify() {
        if (notifyTimer) clearTimeout(notifyTimer);
        notifyTimer = setTimeout(() => {
            store.eventHandler.notify(baseController.getCollection());
        }, 5);
    }

    const storage = createStorage<Data>(notify, store.id);

    const baseController: BaseController<Data> = {

        getCollection(): Data[] {
            return [...storage.values()];
        },

        setCollection(newCollection: Data[], keepNonSync?: boolean) {

            if (storage.setArray(newCollection, keepNonSync)) {

                // If the collection is empty, set selectedModelId to null
                if (storage.size() === 0) {
                    console.log("BaseController: setCollection() empty collection, deselecting");
                    store.selectedModelId = null;
                }

                // If the selected is no longer in the collection, remove selection
                if (!storage.has(store.selectedModelId)) {
                    console.log(`BaseController: setCollection() selected model (${store.selectedModelId}) no longer in collection, deselecting`);
                    store.selectedModelId = null;
                }

                // If autoSelect is enabled, and no model is selected, select the first model
                if (store.autoSelect && !store.selectedModelId && storage.size() > 0) {
                    store.selectedModelId = storage.getFirst().id;
                    console.log(`BaseController: setCollection() auto-selected model (${store.selectedModelId})`);
                }
            }
        },

        get(modelId: string): Data | null {
            return storage.get(modelId) || null;
        },

        getField(modelId: string, key: keyof Data) {
            const model = this.get(modelId);
            return model ? model[key] : null;
        },

        getSelected(): Data | null {
            if (!store.selectedModelId) return null;
            return this.get(store.selectedModelId);
        },

        getSelectedId(): string | null {
            return store.selectedModelId;
        },

        // Set one existing model to the collection. The model will be overwritten, not merged.
        // Todo: support array of models? Or maybe make a setModels or updateCollection instead? Goal: less calls to setCollection
        set(model: Data, select: "no" | "if_empty" | "yes" = "no", markChanged = true) {

            // Normally we need to mark the the model as updated due to sync
            if (markChanged) {
                model.changed_at = Date.now();
            }

            // Store
            storage.set(model);

            // Should we set this model as selected?
            if (select === "yes") {
                this.select(model.id);
            } else if (select === "if_empty" && storage.size() === 0) {
                this.select(model.id);
            }
        },

        setField(modelId: string, key: keyof Data, value: any, markChanged = true) {
            const oldModel = storage.get(modelId);
            if (!oldModel) return false;

            store.baseController.set({ ...oldModel, [key]: value }, "no", markChanged);
        },

        clear() {
            store.mergedController.setCollection(store.initialData ? [...store.initialData] : []);
        },

        delete(modelId: string) {
            storage.delete(modelId);
        },

        select(modelId: string | null) {
            // console.log("BaseController: select() ", modelId);
            if (!modelId) {
                store.selectedModelId = null;
                return;
            }

            if (modelId == store.selectedModelId) {
                return;
            }

            if (storage.has(modelId)) {
                store.selectedModelId = modelId;
            }

            notify();

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
                    sessionId: store.sync.sessionId,
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
            return storage.getFirst();
        },
        has(modelId: string) {
            return storage.has(modelId);
        },

    };

    return baseController;
}

export default createBaseController