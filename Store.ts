import { attach, getSync } from "./sync";
import { Store, Sync } from "./types";

// Global store map. This might be moved to a Context later.
const stores = new Map<string, Store<any>>();

// Add a store to the store map
function addStore(store: Store<any>) {
    stores.set(store.id, store);
    attach(store);
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
        store.baseController.clear();
    }
}


// Logged in session.
let sessionId_: string;

// Start a sync session. TODO: sessionId need to change if the user logs out and in again.
function startSync(url: string, sessionId: string) {
    sessionId_ = sessionId;
    console.log("Store: startSync() url: ", url, "sessionId: ", sessionId);
    getSync(url, sessionId, getStore, getStores);
}




export {
    addStore, clearAll, getStore, getStores, startSync
};
