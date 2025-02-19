import "react";
import createBaseController from "./createBaseController";
import { createEventHandler } from "./EventHandler";
import { addEntryToHistory, addStoreToHistory } from "./history";
import { addStore, getStore, } from "./Store";
import { BaseController, CreateCollectionOptions, Message, Model, Store } from "./types";
import createUseCollection from "./useCollection";
import createUseModel from "./useModel";
import createUseSelected from "./useSelected";
import createUseCom from "./useCom";


// Global data store that updates components when data changes.
// Data is mutable, and is updated by calling setState on components
// that has been subscribed by using useStore()

let collectionCounter = 0;

function createCollection<Data extends Model, ExtraController extends object = {}>(
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

    const originalInitialData = JSON.parse(JSON.stringify(initialData));


    // Set the sync mode
    const syncMode = options?.sync ? options.sync : false;

    const store: Store<Data, ExtraController> = {
        id,
        eventHandler: createEventHandler<Data[]>(),
        // collectionData2: new Map<string, Data>(),
        baseController: null as any, // will be assigned later
        mergedController: null as any, // will be assigned later
        useCollection: null as any, // will be assigned later
        useModel: null as any, // will be assigned later
        useSelected: null as any, // will be assigned later
        useController: null as any, // will be assigned later
        useCom: null as any, // will be assigned later
        selectedModelId: null,
        persist: options?.persist,
        syncMode,
        sync: undefined,
        initialData: originalInitialData, // should we do this? might be a lot of data
        autoSelect: options?.autoSelect === false ? false : true,
        history: true,
        subscribesTo: new Map<(msg: Message) => void, string>,

        subscribe: (topic: string, callback: (msg: Message) => void) => {
            console.log("store: Subscribing to topic: ", topic);
            store.subscribesTo.set(callback, topic);
            return store.sync.subscribe(topic, callback);
        },

        unsubscribe: (topic: string, callback: (msg: Message) => void) => {
            console.log("store: Unsubscribing from topic: ", topic);
            store.subscribesTo.delete(callback);
            return store.sync.unsubscribe(topic, callback);
        },

        resubscribe: () => {
            console.log("store: resubscribe: ", store.id);
            for (let [callback, topic] of store.subscribesTo) {
                console.log("\n\n\n\n\n\n###########)))))))))))))))))))##########store: resubscribe: ", store.id, topic);
                store.sync?.subscribe(topic, callback);
            }
        }

    };


    // Set final values to the store
    store.baseController = createBaseController<Data>(store);
    const customController = options?.createController?.(store.baseController) || {} as ExtraController;
    store.mergedController = { ...store.baseController, ...customController } as BaseController<Data> & ExtraController;
    store.useCollection = createUseCollection<Data>(store);
    store.useModel = createUseModel<Data>(store);
    store.useSelected = createUseSelected<Data>(store);
    store.useCom = createUseCom<Data>(store);
    store.useController = () => store.mergedController;

    // Store it in our global map
    addStore(store);


    // If history is enabled, we run this hack to expose it to debugging.
    // We are going to make a dev attacment point to this later, and 
    // make dev tools enabling us to go back and forth in history.
    if (store.history) {
        addStoreToHistory(store);
    }


    let persistedData: Data[] = [];
    // If we have a persist option, try to load the data from the persist store
    if (options?.persist) {
        const json = options.persist.get(id);
        if (!json) return;

        try {
            const tmp = JSON.parse(json);
            // If any of the date fields (ending in _at) are strings, convert them to timestamps
            for (let model of tmp) {
                if (model.id === "0" || model.id === "1") {
                    continue;
                }
                for (let key in model) {
                    if (key.endsWith("_at") && typeof model[key] === "string") {
                        (model as any)[key] = new Date(model[key] as string).getTime();
                        console.log("createStore() persist converting date: ", id, key, model[key]);
                    }
                }
                persistedData.push(model);
            }
        } catch (e) {
            console.error("createStore() Error parsing JSON: ", e);
            return;
        }
        console.log("createStore() persist loaded data: ", id, persistedData);
        store.baseController.setCollection(persistedData);

    }


    // Subscription to changes in the store
    if (store.persist || store.syncMode || store.history) {

        let timeOut: any;
        store.eventHandler.subscribe((data) => {

            if (timeOut) clearTimeout(timeOut);

            timeOut = setTimeout(() => {

                const changes = store.baseController.__getAndResetChanges();

                const isChanged = changes.deleted.length > 0 || changes.updated.length > 0 || changes.inserted.length > 0;

                if (!isChanged) {
                    console.log("createCollection() event handler: No changes, skipping");
                    return;
                }

                if (store.history) {
                    addEntryToHistory(changes);
                }

                if (store.persist) {
                    store.persist.set(id, JSON.stringify(store.baseController.getCollection()));
                }

                // If we have a sync object and mode is set to one supporting SET,
                // we send the data to the sync object
                if ((syncMode == "auto" || syncMode == "set") && store.syncCallback) {
                    store.sync.sendChanges(changes);
                }

            }, 1500);

        });
    }


    // Set selected to the first model, if any
    if (store.baseController.size() > 0) {
        console.log("createStore() ", store.id, " we have data, select first model");
        const first = store.baseController.getFirst();
        console.log("createStore() ", store.id, " selecting first model: ", first);
        store.baseController.select(first.id);
    }

    return store;
}

// Export as before for compatibility
export default createCollection;
