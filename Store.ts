import { getSync } from "./sync";
import { Collection, Sync } from "./types";
import logger, { LOG_LEVEL_DEBUG } from "./logger";

const {log, err, dbg, level} = logger("Store");

level(LOG_LEVEL_DEBUG)

function createStore(): Store {
    log("Store: createStore()");
    
    // Global store map. This might be moved to a Context later.
    const collections = new Map<string, Collection<any>>();
    
    // Global sync object
    let sync_: Sync | undefined;
    
    // Logged in session.
    let sessionId_: string;
    
    // Create the store object with all methods
    const store: Store = {
        addCollection: function(collection: Collection<any>) {
            dbg("Store: addCollection() collection: ", collection);
            collections.set(collection.id, collection);
            if (sync_) sync_.attach(collection);
        },
        
        getStore: function(id: string) {
            return collections.get(id);
        },
        
        getStores: function() {
            return collections;
        },
        
        clearAll: function() {
            for (let store of collections.values()) {
                store.useController().clear();
            }
        },
        
        startSync: function(url: string, sessionId: string) {
            sessionId_ = sessionId;
            console.log("Store: startSync() url: ", url, "sessionId: ", sessionId);
            sync_ = getSync(url, sessionId, store.getStore, store.getStores);
        },
        
        stopSync: function() {
            if (sync_) {
                sync_.close();
                sync_ = undefined;
            }
        },
        
        getSessionId: function() {
            return sessionId_;
        }
    };
    
    return store;
}

type Store = {
    addCollection: (collection: Collection<any>) => void;
    clearAll: () => void;
    getStore: (id: string) => Collection<any> | undefined;
    getStores: () => Map<string, Collection<any>>;
    startSync: (url: string, sessionId: string) => void;
    stopSync: () => void;
    getSessionId: () => string;
}

export default createStore
export type { Store }
