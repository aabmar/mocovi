import "react";
import { createEventHandler } from "./EventHandler";
import { addStore, getStore, CreateController, BaseController, Store, Controller, UseController, Persist, Model, Sync, Message, CreateCollectionOptions } from "./Store";
import createBaseController from "./BaseController";
import createUseCollection, { UseCollection, UseCollectionReturn } from "./useCollection";
import createUseSelected, { UseSelected, UseSelectedReturn } from "./useSelected";
import createUseModel, { UseModel, UseModelReturn } from "./useModel";


// Global data store that updates components when data changes.
// Data is mutable, and is updated by calling setState on components
// that has been subscribed by using useStore()

let collectionCounter = 0;
let sync_: Sync | undefined; // This should be moved to sync.ts
let sessionId = "1";

const useHistoryDefault = __DEV__ ? true : false;

function createStore<Data extends Model, ExtraController extends object = {}>(
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

    let persistedData: Data[] | undefined = undefined;
    // If we have a persist option, try to load the data from the persist store
    if (options?.persist) {
        const json = options.persist.get(id);
        if (json) {
            try {
                persistedData = JSON.parse(json);
            } catch (e) {
                console.error("createCollection() Error parsing JSON: ", e);
            }
        }
    }


    const store: Store<Data, ExtraController> = {
        id,
        eventHandler: createEventHandler<Data[]>(),
        collectionData: persistedData || initialData,
        baseController: null as any, // will be assigned later
        mergedController: null as any, // will be assigned later
        useCollection: null as any, // will be assigned later
        useModel: null as any, // will be assigned later
        useSelected: null as any, // will be assigned later
        useController: null as any, // will be assigned later
        selectedModelId: null,
        persist: options?.persist,
        sync: undefined,
        previousData: undefined,
        initialData: JSON.parse(JSON.stringify(initialData)), // should we do this? might be a lot of data
        autoSelect: options?.autoSelect,
        history: options?.useHistory === undefined ? useHistoryDefault : options.useHistory,
    };

    // If history is enabled, we run this hack to expose it to debugging.
    // We are going to make a dev attacment point to this later, and 
    // make dev tools enabling us to go back and forth in history.
    if (store.history) {

    }

    let timeOut: any;

    // If we have a persist option, subscribe to the event handler
    // so that we can persist the data to the store
    if (store.persist || options?.sync) {
        store.eventHandler.subscribe((data) => {

            // Todo: add to a queue and only persist every 500 ms or so

            if (timeOut) clearTimeout(timeOut);

            timeOut = setTimeout(() => {
                const json = JSON.stringify(data);
                console.log("Persisting data: ", id, data.length, json.length);

                if (store.persist) {
                    store.persist.set(id, json);
                }

                if (store.syncCallback) {
                    store.syncCallback(data);
                }

            }, 500);

        });
    }

    // Set final values to the store
    store.baseController = createBaseController<Data>(store);
    const customController = options?.createController?.(store.baseController) || {} as ExtraController;
    store.mergedController = { ...store.baseController, ...customController } as BaseController<Data> & ExtraController;
    store.useCollection = createUseCollection<Data>(store);
    store.useModel = createUseModel<Data>(store);
    store.useSelected = createUseSelected<Data>(store);
    store.useController = () => store.mergedController;

    // If the store has sync enabled, add a callback function
    if (options?.sync) {

        store.previousData = new Map<string, Model>();

        // Iterate collection and set previous data
        for (let model of store.collectionData) {
            store.previousData.set(model.id, model);
        }

        const storeId = store.id;

        const callback = (data: Model[]) => {

            if (!store.sync) {
                console.log("createStore(): store has no sync object. store:", store.id);
                return;
            }
            const models = store.sync?.findChangedData(storeId, data);
            if (!models || models.length === 0) {
                return;
            }
            console.log("createStore() ", store.id, " sending sync message: ", models.length);
            const message: Message = {
                storeId,
                operation: "set",
                sessionId: store.sync.sessionId,
                models
            }

            // Todo: we are going to batch messages from different models here (?)
            store.sync.send(message);
        }

        console.log("createStore() ", store.id, " setting sync callback");
        store.syncCallback = callback;
    }

    // Set selected to the first model, if any
    console.log("createStore() ", store.id, " if we have data, select first model");
    if (store.collectionData.length > 0) {
        console.log("createStore() ", store.id, " selecting first model: ", store.collectionData[0].id);
        store.baseController.select(store.collectionData[0].id);
    }

    // Store it in our global map
    addStore(store);
    return store;
}



// Export as before for compatibility
export default createStore;
