import React, { useEffect, useState } from "react";
import { createEventHandler } from "./Event";
import getObjectByKey from './getObjectByKey';
import { stores, CreateController, BaseController } from "./Store";
import { findModelIndexById } from "./findModelIndexById";

// Global data store that updates components when data changes.
// Data is mutable, and is updated by calling setState on components
// that has been subscribed by using useStore()

let storeCounter = 0;

type CreateCollectionOptions<Data, ExtraController = {}> = {
    createController?: CreateController<Data, ExtraController>
};

function createCollection<Data extends { id: any }, ExtraController extends object = {}>(
    id: string,
    initialData: Data[] = [],
    options?: CreateCollectionOptions<Data, ExtraController>
) {
    console.log("useCreateStore() creating store: ", id, "create count: ", storeCounter++);

    const eventHandler = createEventHandler<Data[]>();
    const selectedEventHandler = createEventHandler<Data | null>();

    let collectionData = initialData;
    let selectedModelId: any = null;

    const baseController: BaseController<Data> = {
        getCollection() {
            return collectionData;
        },
        get(modelId: any) {
            return collectionData[findModelIndexById(collectionData, modelId)] || null;
        },
        getField(modelId: any, key: keyof Data) {
            const model = collectionData[findModelIndexById(collectionData, modelId)];
            return model ? model[key] : undefined;
        },
        getSelected() {
            return collectionData[findModelIndexById(collectionData, selectedModelId)] || null;
        },
        setCollection(newCollection: Data[]) {
            // mutate the reference and notify
            collectionData = newCollection;
            eventHandler.notify(collectionData);
        },
        set(model: Data) {
            const idx = findModelIndexById(collectionData, model.id);
            if (idx === -1) return;
            collectionData[idx] = model;
            eventHandler.notify(collectionData);
        },
        setField(modelId: any, key: keyof Data, value: any) {
            const idx = findModelIndexById(collectionData, modelId);
            if (idx === -1) return;
            collectionData[idx][key] = value;
            eventHandler.notify(collectionData);
        },
        clear() {
            collectionData = [];
            eventHandler.notify(collectionData);
        },
        select(modelId: any) {
            selectedModelId = modelId;
            const selectedModel = collectionData[findModelIndexById(collectionData, modelId)] || null;
            selectedEventHandler.notify(selectedModel);
        },
    };

    const customController = options?.createController?.(baseController) || {} as ExtraController;

    const mergedController = { ...baseController, ...customController };

    // Hooks
    function useCollection() {
        const [data, setData] = useState<Data[]>(collectionData);
        useEffect(() => {
            function handleChange(d: Data[]) {
                setData([...d]); // shallow copy
            }
            eventHandler.subscribe(handleChange);
            return () => {
                eventHandler.unsubscribe(handleChange);
            };
        }, []);
        const setCollection = (newCollection: Data[]) => {
            mergedController.setCollection(newCollection);
        };
        return [data, setCollection] as [Data[], (newCollection: Data[]) => void];
    }

    function useModel(modelId: any) {
        const initialModel = collectionData[findModelIndexById(collectionData, modelId)] || {} as Data;
        const [model, setModel] = useState<Data>(initialModel);
        useEffect(() => {
            function handleChange(d: Data[]) {
                const idx = findModelIndexById(d, modelId);
                setModel(idx === -1 ? {} as Data : {...d[idx]});
            }
            eventHandler.subscribe(handleChange);
            return () => {
                eventHandler.unsubscribe(handleChange);
            };
        }, [modelId]);
        const setModelData = (newModel: Data) => {
            mergedController.set(newModel);
        };
        return [model, setModelData] as [Data, (newModel: Data) => void];
    }

    function useSelected() {
        const [selected, setSelected] = useState<Data | null>(
            collectionData[findModelIndexById(collectionData, selectedModelId)] || null
        );
        useEffect(() => {
            function handleChange(selectedModel: Data | null) {
                setSelected(selectedModel);
            }
            selectedEventHandler.subscribe(handleChange);
            return () => {
                selectedEventHandler.unsubscribe(handleChange);
            };
        }, []);
        return selected;
    }

    function useController() {
        return mergedController;
    }

    const store = {
        id,
        useCollection,
        useModel,
        useSelected,
        useController: () => mergedController,
        // ...keep the old useData or code but not used...
    };

    // Store it in our global map
    stores.set(id, store);

    return store;
}

// Export as before for compatibility
export default createCollection;
