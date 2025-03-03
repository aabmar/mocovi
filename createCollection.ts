import "react";
import createBaseController from "./createBaseController";
import { createEventHandler } from "./EventHandler";
import { addEntryToHistory, addStoreToHistory } from "./history";
import { addStore, getStore, } from "./Store";
import { BaseController, CreateCollectionOptions, Message, Model, Store, SyncModes } from "./types";
import createUseCollection from "./useCollection";
import createUseModel from "./useModel";
import createUseSelected from "./useSelected";
import createUseCom from "./useCom";

import useLog, { setLog } from "./logger";
const { log, err, dbg } = useLog("createCollection");

// setLog("createCollection", 3);

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
        dbg("Collection with id already exists: ", id);
        return existingStore;
    }

    log("createCollection() creating collection: ", id, "create count: ", ++collectionCounter);

    const originalInitialData = JSON.parse(JSON.stringify(initialData));

    // Set the sync mode
    const syncMode: SyncModes = options?.sync ? options.sync : false;

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
            dbg("store: Subscribing to topic: ", topic);
            store.subscribesTo.set(callback, topic);
            return store.sync.subscribe(topic, callback);
        },

        unsubscribe: (topic: string, callback: (msg: Message) => void) => {
            dbg("store: Unsubscribing from topic: ", topic);
            store.subscribesTo.delete(callback);
            if (store.sync) return store.sync.unsubscribe(topic, callback);
            return undefined;
        },

        resubscribe: () => {
            dbg("store: resubscribe: ", store.id);
            for (let [callback, topic] of store.subscribesTo) {
                dbg("store: resubscribe: ", store.id, topic);
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
        if (json) {

            try {
                const tmp = JSON.parse(json);
                // If any of the date fields (ending in _at) are strings, convert them to timestamps
                for (let model of tmp) {
                    if (model.id === "0" || model.id === "1" || model.id === "tmp") {
                        continue;
                    }
                    for (let key in model) {
                        if (key.endsWith("_at") && typeof model[key] === "string") {
                            (model as any)[key] = new Date(model[key] as string).getTime();
                            dbg("createStore() persist converting date: ", id, key, model[key]);
                        }
                    }
                    persistedData.push(model);
                }
            } catch (e) {
                err("createStore() Error parsing JSON: ", e);
            }
        }

        if (persistedData.length > 0) {
            log("Setting persisted data: ", id, persistedData.length);
            store.baseController.setCollection(persistedData);
        } else if (initialData.length > 0) {
            log("No persisted data, setting initial data: ", id, initialData?.length);
            store.baseController.setCollection(initialData);
        }
    }

    // Subscription to changes in the store
    if (store.persist || store.syncMode || store.history) {

        function cb() {

            if (!store) {
                log("No store");
                return;
            }

            // TODO: If we dont get them sent, set them back to storage changes
            const changes = store.baseController.__getAndResetChanges();

            const isChanged = changes.deleted.length > 0 || changes.updated.length > 0 || changes.inserted.length > 0;

            if (!isChanged) {
                dbg("createCollection() event handler: No changes, skipping");
                return;
            }

            if (store.history) {
                addEntryToHistory(changes);
            }

            if (store.persist) {
                store.persist.set(id, JSON.stringify(store.baseController.getCollection()));
            }

            const sendChanges = store.sync?.sendChanges;
            if (!sendChanges) {
                dbg("no sendChanges() function. Probably waiting to be connected...");
                return;
            }

            const syncMode = store.syncMode;

            // If we have a sync object and mode is set to one supporting SET,
            // we send the data to the sync object
            if ((syncMode === "auto" || syncMode === "set")) {
                dbg("SyncMode: ", store.id, syncMode);
                sendChanges(changes);
            }
        }

        // Subscribe to changes
        let timeOut: any;
        store.eventHandler.subscribe((data) => {
            if (timeOut) clearTimeout(timeOut);
            timeOut = setTimeout(cb, 1500);
        });
    }

    // Set selected to the first model, if any
    if (store.baseController.size() > 0) {
        dbg("createStore() ", store.id, " we have data, select first model");
        const first = store.baseController.getFirst();
        dbg("createStore() ", store.id, " selecting first model: ", first);
        store.baseController.select(first.id);
    }

    return store;
}

// Export as before for compatibility
export default createCollection;
