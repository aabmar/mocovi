import { useEffect, useState } from "react";
import { Store } from "./Store";

export type UseCollectionReturn<Data extends { id: string }> = [Data[], (newCollection: Data[]) => void, string | null];
export type UseCollection<Data extends { id: string }> = () => UseCollectionReturn<Data>;

function createUseCollection<Data extends { id: string }>(store: Store<Data>): UseCollection<Data> {
    return function useCollection() {

        // This state will be set to the component that uses this hook
        const [data, setData] = useState<Data[]>(store.collectionData);

        useEffect(() => {

            // Make a subscription to changes in the data
            function handleChange(d: Data[]) {
                if (data === d) return;
                setData(d);
            }
            store.eventHandler.subscribe(handleChange);

            // Unsubscribe when the component is unmounted
            return () => {
                store.eventHandler.unsubscribe(handleChange);
            };
        }, []);

        // We make a function to set data so that this hook works like useState for the user
        const setCollection = (newCollection: Data[]) => {
            store.mergedController.setCollection(newCollection);
        };

        return [data, setCollection, store.selectedModelId] as UseCollectionReturn<Data>;
    };
}

export default createUseCollection;
