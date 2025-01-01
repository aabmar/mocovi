import React from "react";
import { createEventHandler } from "./Event";
import { stores, CreateController, BaseController } from "./Store";
import createBaseController from "./BaseController";
import createUseCollection from "./useCollection";
import createUseSelected from "./useSelected";
import createUseModel from "./useModel";

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
    
    if (stores.has(id)) {
        console.log("Collection with id already exists: ", id);
        return stores.get(id);
    }
    
    console.log("createCollection() creating collection: ", id, "create count: ", ++collectionCounter);
    
    const store: any = {
        eventHandler: createEventHandler<Data[]>(),
        selectedEventHandler: createEventHandler<string | null>(),
        collectionData: initialData,
        id: null,
        useCollection: null,
        useModel: null,
        useSelected: null,
        useController: null,
        baseController: null,
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
export default createCollection;
