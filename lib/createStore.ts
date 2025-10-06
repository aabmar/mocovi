import createBaseController from "./createBaseController";
import { createEventHandler } from "./EventHandler";
import { addEntryToHistory, addStoreToHistory } from "./history";
import { BaseController, StoreOptions, Message, Model, Store, SyncModes } from "./types";

import useLog, { LOG_LEVEL_DEBUG, setLog } from "./logger";
const { log, err, dbg, level } = useLog("createCollection");

// level(LOG_LEVEL_DEBUG);

// Global data store that updates components when data changes.
// Data is mutable, and is updated by calling setState on components
// that has been subscribed by using useStore()

let collectionCounter = 0;

function createStore<Data extends Model, ExtraController extends object = {}>(
    id: string,
    initialData: Data[] = [],
    options?: StoreOptions<Data, ExtraController>
): Store<Data, ExtraController> {


    log("CREATE: ", id);
    ++collectionCounter
    const originalInitialData = JSON.parse(JSON.stringify(initialData));

    // Set the sync mode
    const syncMode: SyncModes = options?.sync ? options.sync : false;

    const store: Store<Data, ExtraController> = {
        id,
        eventHandler: createEventHandler<Data[]>(),
        // collectionData2: new Map<string, Data>(),
        baseController: null as any, // will be assigned later
        mergedController: null as any, // will be assigned later
        persist: options?.persist,
        syncMode,
        sync: undefined,
        initialData: originalInitialData, // should we do this? might be a lot of data
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

            // Trying to decode the text string
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
                log("json: ", json);
                err("createStore() Error parsing JSON: ", e);
            }
        }

        if (persistedData.length > 0) {
            dbg("PERSISTED DATA: ", id, persistedData.length);
            store.baseController.setCollection(persistedData, "persist");
        } else if (initialData.length > 0) {
            dbg("INITIAL ", id, initialData?.length);
            store.baseController.setCollection(initialData);
        }
    }

    // Subscription to changes in the store
    if (store.persist || store.syncMode || store.history) {
        dbg("Subscription: PERSIST | SYNC | HISTORY: ", id);

        function cb() {
            if (!store) {
                log("No store");
                return;
            }

            // TODO: If we dont get them sent, set them back to storage changes
            const changes = store.baseController.__getAndResetChanges();

            const isChanged = changes.deleted.length > 0 || changes.updated.length > 0 || changes.inserted.length > 0;

            if (!isChanged) {
                dbg("EVENT: No changes, skipping");
                return;
            }

            if (store.history) {
                addEntryToHistory(changes);
            }

            if (store.persist) {
                let collectionData = store.baseController.getCollection();
                collectionData = collectionData.filter((model) => model.id !== "0" && model.id !== "1" && model.id !== "tmp");
                log("PERSISTING: ", id, collectionData.length);
                store.persist.set(id, JSON.stringify(collectionData));
            }

            const sendChanges = store.sync?.sendChanges;
            if (!sendChanges) {
                dbg("no sendChanges() function. Probably waiting to be connected...");
                return;
            }

            // If we have a sync object and mode is set to one supporting SET,
            // we send the data to the sync object
            const syncMode = store.syncMode;
            if ((syncMode === "auto" || syncMode === "set")) {
                log("SYNC: ", store.id, syncMode, changes.inserted.length, changes.updated.length, changes.deleted.length);
                sendChanges(store, changes);
            }
        }

        // Subscribe to changes
        let timeOut: any;
        store.eventHandler.subscribe((data) => {
            if (timeOut) clearTimeout(timeOut);
            timeOut = setTimeout(cb, 1500);
        });
    } else {
        log("No subscription created for: PERSIST | SYNC | HISTORY: ",
            !!store.persist || !!store.syncMode || !!store.history
        );
    }


    return store;
}

// Export as before for compatibility
export default createStore;
