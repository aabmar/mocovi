


// History is a complete snapshot of the collectionData of all stores at a certain point in time.
// TODO: Not in use now. Reimplement.

import { createEventHandler } from "./EventHandler";
import { ChangeEntry, ChangeLog, Model, Collection } from "./types";
import logger from "./logger";

const { log, err, dbg } = logger("history");

const stores = new Map<string, Collection<any>>();
const initialData = new Map<string, Model[]>();
const changeLog: ChangeLog = [];
const eventHandler = createEventHandler<ChangeLog>();

function addStoreToHistory(store: Collection<any>) {
    log("Adding store to history:", store.id);
    stores.set(store.id, store);
    const json = JSON.stringify(store.baseController.getCollection());
    const data = JSON.parse(json);
    initialData.set(store.id, data);

}

function addEntryToHistory(entry: ChangeEntry) {
    dbg("Adding entry to history:", entry.storeId, entry);
    changeLog.push(entry);
    eventHandler.notify(changeLog);
}

// Go back in history.
// TODO: If we want redo, we instead move a pointer, and if a new setMark() happens, we remove all entries after the pointer.
function undo() {

}


export { addEntryToHistory, addStoreToHistory, eventHandler, undo };

