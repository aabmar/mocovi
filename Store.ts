import { getSync } from "./sync";
import { Store, Sync } from "./types";

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
    return stores;
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



function stopSync() {
    if (sync_) {
        sync_.close();
        sync_ = undefined;
    }
}


export {
    addStore, clearAll, getStore, getStores, startSync, stopSync
};
