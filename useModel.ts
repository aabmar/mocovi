import { useEffect, useState } from "react";
import { findModelIndexById } from "./findModelIndexById";
import { Store } from "./Store";

export type UseModelReturn<Data extends { id: any }> = [Data | null, (newModel: Data) => void];
export type UseModel<Data extends { id: any }> = (modelId?: any) => UseModelReturn<Data>;

function createUseModel<Data extends { id: any }>(store: Store<Data>): UseModel<Data> {
    return function useModel(modelId?: any): UseModelReturn<Data> {
        // If no modelId is provided, use the selected modelId from the store
        if (!modelId) {
            modelId = store.selectedModelId;
        }
        if (!modelId) {
            console.log("useModel() called without modelId and no model is selected");
            return [null, () => { }];
        }

        // Find the initial model based on the modelId
        const initialModel = store.collectionData[findModelIndexById(store.collectionData, modelId)] || {} as Data;

        // This state will be set to the component that uses this hook
        const [model, setModel] = useState<Data>(initialModel);

        useEffect(() => {

            // Make a subscription to changes in the data
            function handleChange(d: Data[]) {
                const idx = findModelIndexById(d, modelId);
                if (idx === -1) return;
                const newModel = d[idx]
                // console.log("useModel() handleChange() ", deepEqual(model, newModel), model, newModel);
                if (model === newModel) return;
                setModel(newModel);
            }
            store.eventHandler.subscribe(handleChange);

            // Unsubscribe when the component is unmounted
            return () => {
                store.eventHandler.unsubscribe(handleChange);
            };
        }, [modelId]);

        // We make a function to set model data so that this hook works like useState for the user
        const setModelData = (newModel: Data) => {
            store.mergedController.set(newModel);
        };

        return [model, setModelData] as UseModelReturn<Data>;
    };
}

export default createUseModel;
