import { useEffect, useState } from "react";
import { findModelIndexById } from "./findModelIndexById";

function createUseSelected(store: any) {
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
        return [sid, setSelectedModel] as [string | null, (modelId: any) => void];
    }

    return useSelected;
}

export default createUseSelected;
