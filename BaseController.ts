import { findModelById, findModelIndexById } from "./findModelIndexById";
import { BaseController } from "./Store";


function createBaseController<Data extends { id: string }>(store: any) {

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
            return findModelById<Data>(store.collectionData, store.selectedModelId);
        },
        getSelectedId(): string | null {
            return store.selectedModelId;
        },
        setCollection(newCollection: Data[]) {
            // mutate the reference and notify
            store.collectionData = [...newCollection];
            store.eventHandler.notify(store.collectionData);
        },
        set(model: Data) {
            const idx = findModelIndexById<Data>(store.collectionData, model.id);
            if (idx === -1) return; // TODO: error handling
            store.collectionData[idx] = { ...model };
            store.eventHandler.notify(store.collectionData);
        },
        setField(modelId: string, key: keyof Data, value: any) {
            const idx = findModelIndexById(store.collectionData, modelId);
            if (idx === -1) return; // TODO: error handling
            store.collectionData[idx] = { ...store.collectionData[idx], [key]: value };
            store.eventHandler.notify(store.collectionData);
        },
        clear() {
            store.collectionData = [];
            store.eventHandler.notify(store.collectionData);
        },
        select(modelId: string | null) {
            // console.log("BaseController: select() ", modelId);
            if (modelId && modelId !== store.selectedModelId) {
                store.selectedModelId = store.collectionData[findModelIndexById(store.collectionData, modelId)]?.id || null;
            }
            store.selectedEventHandler.notify(store.selectedModelId);
        },
    };

    return baseController;
}

export default createBaseController