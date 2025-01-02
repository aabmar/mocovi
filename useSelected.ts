import { useEffect, useState } from "react";
import { findModelIndexById } from "./findModelIndexById";

export type UseSelectedReturn = [string | null, (modelId: any) => void];
export type UseSelected = () => UseSelectedReturn;

function createUseSelected(store: any): UseSelected {
    function useSelected() {
        const [sid, setSid] = useState<string | null>(
            store.collectionData[findModelIndexById(store.collectionData, store.selectedModelId)]?.id || null
        );
        useEffect(() => {
            function handleChange(selectedModelId: string | null) {
                setSid(selectedModelId);
            }
            store.selectedEventHandler.subscribe(handleChange);
            return () => {
                store.selectedEventHandler.unsubscribe(handleChange);
            };
        }, []);

        const setSelectedModel = (modelId: any) => {
            console.log("setSelectedModel() ", modelId);
            store.mergedController.select(modelId);
        }
        return [sid, setSelectedModel] as UseSelectedReturn;
    }

    return useSelected;
}

export default createUseSelected;
