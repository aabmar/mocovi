
import { useContext, useState, PropsWithChildren, useEffect } from "react";
import { StoreContext } from "./StoreContext";
import { Collection, CreateCollectionOptions, Model, Store } from "./types";
import createCollection from "./createCollection";

// Wrap your app in this to provide the store to all components
// You can also wrap local components in you want a local store
export default function Mocovi({ children, setup, }: PropsWithChildren & { setup: { [key: string]: CreateCollectionOptions<Model> }, sessionId?: string }) {

    const store = useContext<Store>(StoreContext);

    useEffect(() => {
        // If storeConfig is provided, we create a new store

        if (setup) {

            // Create a collection for each key in the collectionOptions
            Object.keys(setup).forEach((key) => {
                const options = setup[key];
                const collection = createCollection(key, options.initialData, options);
                store[collection.id] = collection;
            });
            setContext(store);
        }
    }, []);


    return (
        <StoreContext.Provider value={{ store, setStore }}>
            {children}
        </StoreContext.Provider>
    )

}