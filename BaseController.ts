import { findModelById, findModelIndexById } from "./findModelIndexById";
import { BaseController, Model } from "./Store";


function createBaseController<Data extends Model>(store: any) {

    const baseController: BaseController<Data> = {
        getCollection(): Data[] {
            return store.collectionData;
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

        setCollection(newCollection: Data[]) {
            // mutate the reference
            store.collectionData = [...newCollection];

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

        add(model: Data, select = true) {
            const idx = findModelIndexById<Data>(store.collectionData, model.id);
            if (idx !== -1) {
                console.error("Model with id already exists in collection: ", model.id);
                return; // TODO: error handling
            }
            model.changed_at = new Date();
            store.collectionData.push(model);
            store.baseController.setCollection(store.collectionData);

            // If this is the first model added, select it
            if (select) {
                this.select(model.id);
            }
        },

        set(model: Data) {
            const idx = findModelIndexById<Data>(store.collectionData, model.id);
            if (idx === -1) {
                console.error("Model with id does not exist in collection: ", model.id);
                return; // TODO: error handling
            }
            model.changed_at = new Date();
            store.collectionData[idx] = { ...model };
            store.mergedController.setCollection(store.collectionData);
        },

        setField(modelId: string, key: keyof Data, value: any) {
            const idx = findModelIndexById(store.collectionData, modelId);
            if (idx === -1) return; // TODO: error handling
            store.collectionData[idx] = { ...store.collectionData[idx], [key]: value, updated_at: new Date() };
            store.mergedController.setCollection(store.collectionData);
        },

        clear() {
            store.collectionData = store.initialData; // should we use inital data?
            store.selectedModelId = null;
            if (store.autoSelect && store.collectionData.length > 0) {
                store.selectedModelId = store.collectionData[0].id;
            }
            store.mergedController.setCollection(store.collectionData);
        },

        select(modelId: string | null) {
            // console.log("BaseController: select() ", modelId);
            if (!modelId) {
                store.selectedModelId = null;
            } else if (modelId !== store.selectedModelId) {
                store.selectedModelId = store.collectionData[findModelIndexById(store.collectionData, modelId)]?.id || null;
            }
            store.mergedController.setCollection(store.collectionData);
        },
    };

    return baseController;
}

export default createBaseController