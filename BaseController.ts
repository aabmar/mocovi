import { createStorage } from "./storage";
import { BaseController, Message, Model, Store } from "./types";

function createBaseController<Data extends Model>(store: Store<Data>,) {

    let notifyTimer: any;

    function notify() {
        if (notifyTimer) clearTimeout(notifyTimer);
        notifyTimer = setTimeout(() => {
            store.eventHandler.notify(baseController.getCollection());
        }, 5);
    }

    const storage = createStorage<Data>(notify);

    const baseController: BaseController<Data> = {

        getCollection(): Data[] {
            return [...storage.values()];
        },

        setCollection(newCollection: Data[]) {

            if (storage.setArray(newCollection)) {

                // If the collection is empty, set selectedModelId to null
                if (newCollection.length === 0) {
                    store.selectedModelId = null;
                }

                // If the selected is no longer in the collection, remove selection
                if (!storage.has(store.selectedModelId)) {
                    store.selectedModelId = null;
                }

                // If autoSelect is enabled, and no model is selected, select the first model
                if (store.autoSelect && !store.selectedModelId && storage.size() > 0) {
                    store.selectedModelId = storage.keys().next().value;
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

        add(model: Data, select = true, markChanged = true) {

            // Check if model already
            if (storage.has(model.id)) {
                throw new Error(`Model with id already exists in collection: ${model.id}`);
            }

            if (markChanged) model.changed_at = Date.now();

            storage.set(model);

            // If this is the first model added, select it
            if (select === true) {
                this.select(model.id);
            } else if (select === "if_empty" && storage.size() === 0) {
                this.select(model.id);
            }
        },

        // Set one existing model to the collection. The model will be overwritten, not merged.
        // Todo: support array of models? Or maybe make a setModels or updateCollection instead? Goal: less calls to setCollection
        set(model: Data, markChanged = true) {
            if (!storage.has(model.id)) {
                throw new Error(`Model with id does not exist in collection: ${model.id}`);
            }

            if (markChanged) {
                model.changed_at = Date.now();
            }

            storage.set(model);

        },

        setField(modelId: string, key: keyof Data, value: any, markChanged = true) {
            const oldModel = storage.get(modelId);
            if (!oldModel) return false;

            store.baseController.set({ ...oldModel, [key]: value }, markChanged);
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

    };

    return baseController;
}

export default createBaseController