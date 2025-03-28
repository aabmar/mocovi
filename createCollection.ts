import "react";
import createBaseController from "./createBaseController";
import { createEventHandler } from "./EventHandler";
import { addEntryToHistory, addStoreToHistory } from "./history";
import { addStore, getStore, } from "./Store";
import { BaseController, CreateCollectionOptions, Message, Model, Collection, SyncModes } from "./types";
import createUseCollection from "./useCollection";
import createUseModel from "./useModel";
import createUseSelected from "./useSelected";
import createUseCom from "./useCom";

import useLog, { LOG_LEVEL_DEBUG, setLog } from "./logger";
const { log, err, dbg, level } = useLog("createCollection");

// level(LOG_LEVEL_DEBUG);

// Global data store that updates components when data changes.
// Data is mutable, and is updated by calling setState on components
// that has been subscribed by using useStore()

let collectionCounter = 0;

function createCollection<Data extends Model>(
    id: string,
    initialData: Data[] = [],
    options?: CreateCollectionOptions<Data>
): Collection<Data> {

    const existingStore = getStore(id) as Collection<Data>;
    if (existingStore) {
        dbg("Collection with id already exists: ", id);
        return existingStore;
    }

    log("CREATE: ", id);
    ++collectionCounter;

    const originalInitialData = JSON.parse(JSON.stringify(initialData));

    // Set the sync mode
    const syncMode: SyncModes = options?.sync ? options.sync : false;

    const collection: Collection<Data> = {
        id,
        eventHandler: createEventHandler<Data[]>(),
        // collectionData2: new Map<string, Data>(),
        baseController: null as any, // will be assigned later
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
            dbg("collection: Subscribing to topic: ", topic);
            collection.subscribesTo.set(callback, topic);
            return collection.sync.subscribe(topic, callback);
        },

        unsubscribe: (topic: string, callback: (msg: Message) => void) => {
            dbg("collection: Unsubscribing from topic: ", topic);
            collection.subscribesTo.delete(callback);
            if (collection.sync) return collection.sync.unsubscribe(topic, callback);
            return undefined;
        },

        resubscribe: () => {
            dbg("collection: resubscribe: ", collection.id);
            for (let [callback, topic] of collection.subscribesTo) {
                dbg("store: resubscribe: ", collection.id, topic);
                collection.sync?.subscribe(topic, callback);
            }
        }

    };

    // Set final values to the collection object
    collection.baseController = createBaseController<Data>(collection);
    collection.useCollection = createUseCollection<Data>(collection);
    collection.useModel = createUseModel<Data>(collection);
    collection.useSelected = createUseSelected<Data>(collection);
    collection.useCom = createUseCom<Data>(collection);
    collection.useController = () => collection.baseController;

    // Store it in our global map
    addStore(collection);


    // If history is enabled, we run this hack to expose it to debugging.
    // We are going to make a dev attacment point to this later, and 
    // make dev tools enabling us to go back and forth in history.
    if (collection.history) {
        addStoreToHistory(collection);
    }


    let persistedData: Data[] = [];
    // If we have a persist option, try to load the data from the persist collection
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
                err("createStore() Error parsing JSON: ", e);
            }
        }

        if (persistedData.length > 0) {
            dbg("PERSISTED DATA: ", id, persistedData.length);
            collection.baseController.setCollection(persistedData, "persist");
        } else if (initialData.length > 0) {
            dbg("INITIAL ", id, initialData?.length);
            collection.baseController.setCollection(initialData);
        }
    }

    // Subscription to changes in the collection
    if (collection.persist || collection.syncMode || collection.history) {
        dbg("Subscription: PERSIST | SYNC | HISTORY: ", id);

        function cb() {
            if (!collection) {
                log("No collection, skipping");
                return;
            }

            // TODO: If we dont get them sent, set them back to storage changes
            const changes = collection.baseController.__getAndResetChanges();

            const isChanged = changes.deleted.length > 0 || changes.updated.length > 0 || changes.inserted.length > 0;

            if (!isChanged) {
                dbg("EVENT: No changes, skipping");
                return;
            }

            if (collection.history) {
                addEntryToHistory(changes);
            }

            if (collection.persist) {
                let collectionData = collection.baseController.getCollection();
                collectionData = collectionData.filter((model) => model.id !== "0" && model.id !== "1" && model.id !== "tmp");
                log("PERSISTING: ", id, collectionData.length);
                collection.persist.set(id, JSON.stringify(collectionData));
            }

            const sendChanges = collection.sync?.sendChanges;
            if (!sendChanges) {
                dbg("no sendChanges() function. Probably waiting to be connected...");
                return;
            }

            // If we have a sync object and mode is set to one supporting SET,
            // we send the data to the sync object
            const syncMode = collection.syncMode;
            if ((syncMode === "auto" || syncMode === "set")) {
                log("SYNC: ", collection.id, syncMode, changes.inserted.length, changes.updated.length, changes.deleted.length);
                sendChanges(collection, changes);
            }
        }

        // Subscribe to changes
        let timeOut: any;
        collection.eventHandler.subscribe((data) => {
            if (timeOut) clearTimeout(timeOut);
            timeOut = setTimeout(cb, 1500);
        });
    } else {
        log("No subscription created for: PERSIST | SYNC | HISTORY: ",
            !!collection.persist || !!collection.syncMode || !!collection.history
        );
    }

    // Set selected to the first model, if any
    if (collection.autoSelect && collection.baseController.size() > 0) {
        collection.baseController.select(true);
    }

    return collection;
}

// Export as before for compatibility
export default createCollection;
