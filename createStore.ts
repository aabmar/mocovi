import "react";
import createBaseController from "./BaseController";
import { createEventHandler } from "./EventHandler";
import { addStore, getStore, } from "./Store";
import { BaseController, CreateCollectionOptions, Message, Model, Store } from "./types";
import createUseCollection from "./useCollection";
import createUseModel from "./useModel";
import createUseSelected from "./useSelected";
import createUseCommand from "./useCommand";


// Global data store that updates components when data changes.
// Data is mutable, and is updated by calling setState on components
// that has been subscribed by using useStore()

let collectionCounter = 0;

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

    const originalInitialData = JSON.parse(JSON.stringify(initialData));

    // Set the sync mode
    const syncMode = options?.sync ? options.sync : false;

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
        useCommand: null as any, // will be assigned later
        selectedModelId: null,
        persist: options?.persist,
        syncMode,
        sync: undefined,
        previousData: undefined,
        initialData: originalInitialData, // should we do this? might be a lot of data
        autoSelect: options?.autoSelect,
        // history: options?.useHistory === undefined ? useHistoryDefault : options.useHistory,
    };

    // If history is enabled, we run this hack to expose it to debugging.
    // We are going to make a dev attacment point to this later, and 
    // make dev tools enabling us to go back and forth in history.
    if (store.history) {
        // TODO: Old implementation was removed. Make a new one.
    }

    let timeOut: any;

    // If we have a persist option, subscribe to the event handler
    // so that we can persist the data to the store
    if (store.persist || options?.sync) {



        store.eventHandler.subscribe((data) => {

            // Todo: add to a queue and only persist every 500 ms or so

            if (timeOut) clearTimeout(timeOut);

            timeOut = setTimeout(() => {
                // Copy fields from data, except the ones starting with _
                // We don't want to persist internal fields

                const dataToStore = [] as Data[];

                for (let model of data) {
                    const newModel = {} as Data;
                    for (let key in model) {
                        if (key[0] !== "_") {
                            newModel[key] = model[key];
                        }
                    }
                    dataToStore.push(newModel);
                }


                const json = JSON.stringify(dataToStore);


                if (store.persist) {
                    console.log("Persisting data: ", id, dataToStore.length, json.length);
                    store.persist.set(id, json);
                }

                // If we have a sync object and mode is set to one supporting SET,
                // we send the data to the sync object
                if ((syncMode == "auto" || syncMode == "set") && store.syncCallback) {
                    store.syncCallback(data);
                }

            }, 1500);

        });
    }

    // Set final values to the store
    store.baseController = createBaseController<Data>(store);
    const customController = options?.createController?.(store.baseController) || {} as ExtraController;
    store.mergedController = { ...store.baseController, ...customController } as BaseController<Data> & ExtraController;
    store.useCollection = createUseCollection<Data>(store);
    store.useModel = createUseModel<Data>(store);
    store.useSelected = createUseSelected<Data>(store);
    store.useCommand = createUseCommand<Data>(store);
    store.useController = () => store.mergedController;

    // If the store has sync enabled, add a callback function
    if (syncMode == "auto" || syncMode == "set" || syncMode == "manual") {

        // Store the previous data for comparison
        store.previousData = new Map<string, Model>();
        for (let model of store.collectionData) {
            store.previousData.set(model.id, { ...model });
        }

        const storeId = store.id;

        // Every change done to the store will call this function
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
                payload: models
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
