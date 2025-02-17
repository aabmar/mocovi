import { findModelById, findModelIndexById } from "./findModelIndexById";
import { BaseController, Message, Model, Store } from "./types";

function createBaseController<Data extends Model>(store: Store<Data>) {

    const baseController: BaseController<Data> = {
        getCollection(): Data[] {
            return store.collectionData;
        },

        // ALL data change should go through setCollection.
        // All functions working on a Model, a Field, selecting the current model, etc
        // will call setCollection to update the data.
        // This is to ensure that the eventHandler is called and the data is updated in the store
        // in a uniform way, and to prevent bugs.
        setCollection(newCollection: Data[]) {

            // mutate the reference
            store.collectionData = [...newCollection];

            // TODO: history is removed for now. Reimplement later
            // if (store.history) {
            //     historyMark();
            // }

            // If the collection is empty, set selectedModelId to null
            if (newCollection.length === 0) {
                store.selectedModelId = null;
            }

            // If the selected is no longer in the collection, remove selection
            if (!store.collectionData.find((m: Data) => m.id === store.selectedModelId)) {
                store.selectedModelId = null;
            }

            // If autoSelect is enabled, and no model is selected, select the first model
            if (store.autoSelect && !store.selectedModelId) {
                store.selectedModelId = store.collectionData[0].id;
            }

            store.eventHandler.notify(store.collectionData);
        },

        get(modelId: string): Data | null {
            return findModelById(store.collectionData, modelId);
        },

        getField(modelId: string, key: keyof Data) {
            const model = findModelById<Data>(store.collectionData, modelId);
            return model ? model[key] : null;
        },

        getSelected(): Data | null {

            if (!store.selectedModelId) return null
            return findModelById<Data>(store.collectionData, store.selectedModelId);
        },

        getSelectedId(): string | null {
            return store.selectedModelId;
        },

        add(model: Data, select = true, markChanged = true) {
            const idx = findModelIndexById<Data>(store.collectionData, model.id);
            if (idx !== -1) {
                console.error("Model with id already exists in collection: ", model.id);
                return; // TODO: error handling
            }

            model.created_at = new Date();
            model.changed_at = model.created_at;
            if (markChanged) model.changed_at = new Date();

            store.collectionData.push(model);
            store.baseController.setCollection(store.collectionData);

            // If this is the first model added, select it
            if (select === true) {
                this.select(model.id);
            } else if (select === "if_empty" && store.collectionData.length === 0) {
                this.select(model.id);
            }
        },

        // Set one existing model to the collection. The model will be overwritten, not merged.
        // Todo: support array of models? Or maybe make a setModels or updateCollection instead? Goal: less calls to setCollection
        set(model: Data, markChanged = true) {
            const idx = findModelIndexById<Data>(store.collectionData, model.id);
            if (idx === -1) {
                console.error("Model with id does not exist in collection: ", model.id);
                return; // TODO: error handling
            }
            if (markChanged) {
                model.changed_at = new Date();
            }
            store.collectionData[idx] = { ...model };
            store.baseController.setCollection(store.collectionData);

        },

        setField(modelId: string, key: keyof Data, value: any, markChanged = true) {
            const idx = findModelIndexById(store.collectionData, modelId);
            const oldModel = store.collectionData[idx];
            if (idx === -1) return; // TODO: error handling
            store.baseController.set({ ...oldModel, [key]: value }, markChanged);
        },

        clear() {
            store.mergedController.setCollection(store.initialData ? [...store.initialData] : []);
        },

        select(modelId: string | null) {
            // console.log("BaseController: select() ", modelId);
            if (!modelId) {
                store.selectedModelId = null;
            } else if (modelId !== store.selectedModelId) {
                const newIndex = findModelIndexById(store.collectionData, modelId);
                const lookedUpId = store.collectionData[newIndex]?.id || null;
                store.selectedModelId = lookedUpId;
                if (newIndex !== null) {
                    store.collectionData[newIndex] = { ...store.collectionData[newIndex] };
                }
            }
            store.mergedController.setCollection(store.collectionData);
        },

        fetch(id?: string | string[]) {

            // If not id, let it be an empty array. If its a string, an array with one string. Else, its an array of strings.
            let models: Model[];
            if (!id) {
                models = [];
            } else if (typeof id === "string") {
                models = [{ id }];
            } else {
                models = id.map(id => ({ id }));
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

        delete(modelId: string) {
            const collection = store.mergedController.getCollection();
            const idx = findModelIndexById(collection, modelId);
            if (idx === -1) return; // TODO: error handling
            collection.splice(idx, 1);
            store.mergedController.setCollection(collection);
        }
    };

    return baseController;
}

export default createBaseController