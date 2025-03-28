
import { useContext, useState, PropsWithChildren, useEffect } from "react";
import { StoreContext } from "./StoreContext";
import { Collection, CreateCollectionOptions, Model, Store } from "./types";
import createCollection from "./createCollection";

// Wrap your app in this to provide the store to all components
// You can also wrap local components in you want a local store
export default function Mocovi({ children, setup, }: PropsWithChildren & { setup: { [key: string]: CreateCollectionOptions<Model> }, sessionId?: string }) {

    const [store, setStore] = useState<Store | null>(null);

    useEffect(() => {
        // If storeConfig is provided, we create a new store

        if (setup) {
            const store: Store = {
                collections: new Map<string, Collection<Model>>(),
            };

            // Create a collection for each key in the collectionOptions
            Object.keys(setup).forEach((key) => {
                const options = setup[key];
                const collection = createCollection(key, options.initialData, options);
                store[collection.id] = collection;
            });
            setStore(store);
        }
    }, []);


    return (
        <StoreContext.Provider value={{ store, setStore }}>
            {children}
        </StoreContext.Provider>
    )

}