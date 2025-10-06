import { createContext, ReactNode, useRef } from "react";
import createStore from "../lib/createStore";
import { MocoviContextContentType, MocoviStoreDescriptor, Model, Store, StoreOptions } from "../lib/types";


/**
 * The context type for Mocovi, providing methods to manage stores.
 *
 * getStore: Retrieve a store by its ID.
 * getStores: Retrieve all stores.
 * addStore: Create a new store and add it to the stores map.
 * clearAll: Clear all stores.
 */


const MocoviContext = createContext<MocoviContextContentType | null>(null);

type MocoviProviderProps = {
    children: ReactNode;
    storeDescriptors?: MocoviStoreDescriptor[];
}

function MocoviProvider({ children, storeDescriptors }: MocoviProviderProps): JSX.Element {

    const storesRef = useRef<Map<string, Store<any>>>(new Map());

    const stores = storesRef.current;

    // Add a store to the store map
    function addStore<Data extends Model, ExtraController extends object = {}>(id: string, initialData: Data[], options?: StoreOptions<Data, ExtraController>): Store<Data, ExtraController> {
        if (stores.has(id)) {
            throw new Error(`Store with id "${id}" already exists.`);
        }
        const store = createStore(id, initialData, options);
        stores.set(store.id, store);
        return store;
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

    // If we got store descriptors, create the stores
    if (storeDescriptors) {
        for (let desc of storeDescriptors) {
            if (!stores.has(desc.id)) {
                addStore(desc.id, desc.initialData || [], desc.options);
            }
        }
    }

    // The context data we provide
    const contextData: MocoviContextContentType = {
        addStore,
        getStore,
        getStores,
        clearAll
    };

    return (
        <MocoviContext.Provider value={contextData} >
            {children}
        </MocoviContext.Provider>
    );

}

export default MocoviContext;
export { MocoviProvider };
export type { MocoviContextContentType, MocoviProviderProps };

