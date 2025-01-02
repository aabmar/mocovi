import { useEffect, useState } from "react";
import { findModelIndexById } from "./findModelIndexById";
import { Store } from "./Store";

export type UseSelectedReturn = [string | null, (modelId: string) => void];
export type UseSelected = () => UseSelectedReturn;

function createUseSelected<Data extends { id: string }>(store: Store<Data>): UseSelected {

    function useSelected() {

        let initialId: string | null = null
        if (store.selectedModelId !== null) {
            initialId = store.collectionData[findModelIndexById(store.collectionData, store.selectedModelId)].id || null;
        }

        const [sid, setSid] = useState<string | null>(initialId);

        useEffect(() => {
            function handleChange(selectedModelId: string | null) {
                setSid(selectedModelId);
            }
            store.selectedEventHandler.subscribe(handleChange);
            return () => {
                store.selectedEventHandler.unsubscribe(handleChange);
            };
        }, [store]);

        const setSelectedModel = (modelId: string) => {
            // console.log("setSelectedModel() ", modelId);
            store.mergedController.select(modelId);
        }

        return [sid, setSelectedModel] as UseSelectedReturn;
    }

    return useSelected;
}

export default createUseSelected;
