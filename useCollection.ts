import { useEffect, useState } from "react";
import { Store, UseCollection, UseCollectionReturn } from "./types";
import useLog, { LOG_LEVEL_DEBUG } from "./logger";
const { log, dbg, level } = useLog("useCollection");

// level(LOG_LEVEL_DEBUG);

function createUseCollection<Data extends { id: string }>(store: Store<Data>): UseCollection<Data> {

    /**
     * @deprecated This hook is deprecated and will be removed in a future version.
     * Please use the new useStore hook instead:
     * const { collection, setCollection } = useStore<Data>("storeId");
     */
    return function useCollection() {

        // This state will be set to the component that uses this hook
        const [data, setData] = useState<Data[]>(store.baseController.getCollection());

        useEffect(() => {

            // Make a subscription to changes in the data
            function handleChange(d: Data[]) {
                if (data === d) {
                    dbg("handleChange() Data is the same");
                    return;
                }
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
