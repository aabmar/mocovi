import { getSync } from "./sync";
import { Model, Store, Sync } from "./types";

// Global store map. This might be moved to a Context later.
const stores = new Map<string, Store<any>>();

// Add a store to the store map
function addStore(store: Store<any>) {
    stores.set(store.id, store);
    if (sync_) sync_.attach(store);
}

// Get a store from the store map
function getStore(id: string) {
    return stores.get(id);
}

function getStores() {
    return stores.values();
}

// Clear all stores
function clearAll() {
    for (let store of stores.values()) {
        store.useController().clear();
    }
}

// Global sync object
let sync_: Sync | undefined;

// Logged in session.
let sessionId_: string;

// Start a sync session. TODO: sessionId need to change if the user logs out and in again.
function startSync(url: string, sessionId: string) {
    sessionId_ = sessionId;
    console.log("Store: startSync() url: ", url, "sessionId: ", sessionId);
    sync_ = getSync(url, sessionId, getStore, getStores);
}

// History is a complete snapshot of the collectionData of all stores at a certain point in time.
// TODO: Not in use now. Reimplement.
type HistoryEntry = {
    [key: string]: Model[]
}
const history: HistoryEntry[] = [];

let timeOut: any;

// Batch data for history
// TODO: Not in use now. Reimplement
function historyMark() {

    if (timeOut) clearTimeout(timeOut);

    timeOut = setTimeout(() => {
        const entry: HistoryEntry = {};
        for (const store of stores.values()) {
            if (store.history) {
                entry[store.id] = store.collectionData;
            }
        }
        history.push(entry);

    }, 100);
}

// Go back in history.
// TODO: Not in use now. Reimplement
function undo() {
    if (history.length > 1) {
        const last = history.pop();
        const newState = history[history.length - 1];

        if (!newState) return;
        for (const store of stores.values()) {
            if (store.history) {
                store.collectionData = newState[store.id];
                store.eventHandler.notify(store.collectionData);
            }
        }

        console.log(" ///////////////////// Store undo() ///////////////////\n", diff(last, newState));
    }
}

// Print all values that are different between two objects on the format
// key.key.key: value1 -> value2

function diff(a: any, b: any, path = "") {
    console.log(a === b)
    let diffs = "";
    for (const key in a) {
        // console.log("key: ", key, a[key] !== b[key], a[key], b[key]);
        if (typeof a[key] === "object") {
            diffs += diff(a[key], b[key], path + key + ".");
        } else if (a[key] !== b[key]) {
            diffs += path + key + ": " + a[key] + " -> " + b[key] + "\n";
        }
    }
    return diffs;
}


export {
    addStore, clearAll, getStore, historyMark, startSync, undo
};

