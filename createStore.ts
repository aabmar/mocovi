import React from "react";
import { createEventHandler } from "./EventHandler";
import { addStore, getStore, CreateController, BaseController, Store, Controller, UseController, Persist } from "./Store";
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
    persist?: Persist,
    sync?: true | string
};

function createStore<Data extends { id: string }, ExtraController extends object = {}>(
    id: string,
    initialData: Data[] = [],
    options?: CreateCollectionOptions<Data, ExtraController>
): Store<Data, ExtraController> {

    const existingStore = getStore(id) as Store<Data, ExtraController>;
    if (existingStore) {
        console.log("Collection with id already exists: ", id);
        return existingStore;
    }

    console.log("createCollection() creating collection: ", id, "create count: ", ++collectionCounter);

    // If we have a persist option, try to load the data from the persist store
    if (options?.persist) {
        const json = options.persist.get(id);
        if (json) {
            initialData = JSON.parse(json);
        }
    }


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
        persist: options?.persist,
        sync: options?.sync
    };

    let timeOut: number | undefined;

    // If we have a persist option, subscribe to the event handler
    // so that we can persist the data to the store
    if (store.persist || store.sync) {
        store.eventHandler.subscribe((data) => {

            if (timeOut) clearTimeout(timeOut);

            timeOut = setTimeout(() => {
                const json = JSON.stringify(data);
                console.log("Persisting data: ", id, json);

                if (store.persist) {
                    store.persist?.set(id, json);
                }

                if (store.sync) {

                }

            }, 100);

        });
    }


    // Set final values to the store
    store.baseController = createBaseController<Data>(store);
    const customController = options?.createController?.(store.baseController) || {} as ExtraController;
    store.mergedController = { ...store.baseController, ...customController } as BaseController<Data> & ExtraController;
    store.useCollection = createUseCollection(store);
    store.useModel = createUseModel(store);
    store.useSelected = createUseSelected(store);
    store.useController = () => store.mergedController;



    // Store it in our global map
    addStore(store);
    return store;
}



// Export as before for compatibility
export default createStore;
