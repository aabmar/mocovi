import React, { useEffect, useState } from "react";
import { createEventHandler } from "./Event";
import getObjectByKey from './getObjectByKey';
import { stores, CreateController, BaseController } from "./Store";
import { findModelIndexById } from "./findModelIndexById";

// Global data store that updates components when data changes.
// Data is mutable, and is updated by calling setState on components
// that has been subscribed by using useStore()

let collectionCounter = 0;

type CreateCollectionOptions<Data, ExtraController = {}> = {
    createController?: CreateController<Data, ExtraController>
};

function createCollection<Data extends { id: any }, ExtraController extends object = {}>(
    id: string,
    initialData: Data[] = [],
    options?: CreateCollectionOptions<Data, ExtraController>
) {
    console.log("createCollection() creating collection: ", id, "create count: ", collectionCounter++);

    if (stores.has(id)) {
        console.log("Collection with id already exists: ", id);
        return stores.get(id);
    }

    // const internals = {
    const eventHandler = createEventHandler<Data[]>();
    const selectedEventHandler = createEventHandler<string | null>();
    // }

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
        select(modelId: string) {
            console.log("BaseController: select() ", modelId);
            selectedModelId = collectionData[findModelIndexById(collectionData, modelId)]?.id || null;
            selectedEventHandler.notify(selectedModelId);
        },
    };

    const customController = options?.createController?.(baseController) || {} as ExtraController;

    const mergedController = { ...baseController, ...customController } as BaseController<Data> & ExtraController;

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

    function useModel(modelId?: any) {
        if (!modelId) {
            modelId = selectedModelId;
        }
        if (!modelId) {
            console.log("useModel() called without modelId and no model is selected");
            return [null, () => { }];
        }

        const initialModel = collectionData[findModelIndexById(collectionData, modelId)] || {} as Data;
        const [model, setModel] = useState<Data>(initialModel);

        useEffect(() => {

            function handleChange(d: Data[]) {
                const idx = findModelIndexById(d, modelId);
                const newModel = { ...d[idx] }
                // console.log("useModel() handleChange() ", deepEqual(model, newModel), model, newModel);
                if (deepEqual(model, newModel)) return;

                setModel(idx === -1 ? {} as Data : { ...newModel });
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

    function useQuery(path: string | string[]) {
        const modelId = selectedModelId;

        // console.log("useQuery() ", path, modelId);

        if (!modelId) {
            console.log("useQuery() called without modelId and no model is selected");
            return [null, () => { }];
        }

        const model_ = collectionData[findModelIndexById(collectionData, modelId)] || {} as Data;
        const initialModel = getObjectByKey(model_, path);
        const [model, setModel] = useState<Data>(initialModel);


        useEffect(() => {

            function handleChange(d: Data[]) {
                const idx = findModelIndexById(d, modelId);
                const newModel_ = { ...d[idx] }
                const newModel = getObjectByKey(newModel_, path);
                // console.log("useQuery() handleChange() ", newModel.id);
                if (newModel.id === "c0.0") {
                    console.log("useQuery() handleChange() equal? ", deepEqual(model, newModel), model, newModel);
                }
                if (deepEqual(model, newModel)) return;

                setModel(idx === -1 ? {} as Data : { ...newModel });
            }
            eventHandler.subscribe(handleChange);
            return () => {
                eventHandler.unsubscribe(handleChange);
            };
        }, [modelId]);

        const setModelData = (newModel: Data) => {
            console.error("useQuery() setModelData() not implemented. get from set field with path from old version");
        };

        return [model, setModelData] as [Data, (newModel: Data) => void];
    }

    function useSelected() {
        const [sid, setSid] = useState<string | null>(
            collectionData[findModelIndexById(collectionData, selectedModelId)]?.id || null
        );
        useEffect(() => {
            function handleChange(selectedModelId: string | null) {
                setSid(selectedModelId);
            }
            selectedEventHandler.subscribe(handleChange);
            return () => {
                selectedEventHandler.unsubscribe(handleChange);
            };
        }, []);

        const setSelectedModel = (modelId: any) => {
            console.log("setSelectedModel() ", modelId);
            mergedController.select(modelId);
        }
        return [sid, setSelectedModel] as [string | null, (modelId: any) => void];
    }

    function useController() {
        return mergedController;
    }

    const store = {
        id,
        useCollection,
        useModel,
        useSelected,
        useQuery,
        useController: () => mergedController,
        // ...keep the old useData or code but not used...
    };

    // Store it in our global map
    stores.set(id, store);

    return store;
}

function deepEqual(a: any, b: any): boolean {
    if (a === b) return true;

    if (typeof a !== 'object' || typeof b !== 'object') {
        return a === b; // handle primitive types including numbers
    }

    if (Object.keys(a).length !== Object.keys(b).length) return false;

    for (const key in a) {
        if (!(key in b)) return false;
        if (!deepEqual(a[key], b[key])) return false;
    }
    return true;
}

// Export as before for compatibility
export default createCollection;
