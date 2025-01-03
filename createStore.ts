import React from "react";
import { createEventHandler } from "./EventHandler";
import { stores, CreateController, BaseController, Store, Controller, UseController } from "./Store";
import createBaseController from "./BaseController";
import createUseCollection, { UseCollection, UseCollectionReturn } from "./useCollection";
import createUseSelected, { UseSelected, UseSelectedReturn } from "./useSelected";
import createUseModel, { UseModel, UseModelReturn } from "./useModel";

// Global data store that updates components when data changes.
// Data is mutable, and is updated by calling setState on components
// that has been subscribed by using useStore()

let collectionCounter = 0;

type CreateCollectionOptions<Data, ExtraController = {}> = {
    createController?: CreateController<Data, ExtraController>
    storage?: { set: (key: string, value: string) => void, get: (key: string) => string }
};

function createStore<Data extends { id: string }, ExtraController extends object = {}>(
    id: string,
    initialData: Data[] = [],
    options?: CreateCollectionOptions<Data, ExtraController>
): Store<Data, ExtraController> {

    if (stores.has(id)) {
        console.log("Collection with id already exists: ", id);
        return stores.get(id) as Store<Data, ExtraController>;
    }

    console.log("createCollection() creating collection: ", id, "create count: ", ++collectionCounter);

    const store: Store<Data, ExtraController> = {
        id,
        eventHandler: createEventHandler<Data[]>(),
        selectedEventHandler: createEventHandler<string | null>(),
        collectionData: initialData,
        baseController: null as any, // will be assigned later
        mergedController: null as any, // will be assigned later
        useCollection: null as any, // will be assigned later
        useModel: null as any, // will be assigned later
        useSelected: null as any, // will be assigned later
        useController: null as any, // will be assigned later
        selectedModelId: null,
    };

    store.baseController = createBaseController<Data>(store);
    const customController = options?.createController?.(store.baseController) || {} as ExtraController;
    store.mergedController = { ...store.baseController, ...customController } as BaseController<Data> & ExtraController;
    store.useCollection = createUseCollection(store);
    store.useModel = createUseModel(store);
    store.useSelected = createUseSelected(store);
    store.useController = () => store.mergedController;

    // Store it in our global map
    stores.set(id, store);
    return store;
}



// Export as before for compatibility
export default createStore;
