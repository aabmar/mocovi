import { useEffect, useState } from "react";
import { findModelIndexById, findModelById } from "./findModelIndexById";
import { Store } from "./Store";

export type UseModelReturn<Data extends { id: string }> = [Data | null, (newModel: Data) => void];
export type UseModel<Data extends { id: string }> = (modelId: string | null) => UseModelReturn<Data>;

function createUseModel<Data extends { id: string }>(store: Store<Data>): UseModel<Data> {
    return function useModel(modelId): UseModelReturn<Data> {

        // console.log("useModel() called with modelId: ", modelId);

        // Find the initial model based on the modelId
        const initialModel = findModelById(store.collectionData, modelId) || null;

        // This state will be set to the component that uses this hook
        const [model, setModel] = useState<Data | null>(initialModel);

        useEffect(() => {

            // Make a subscription to changes in the data
            function handleChange(d: Data[]) {
                if (!modelId) return;
                const newModel = findModelById(d, modelId);
                if (model === newModel) return;
                setModel(newModel);
            }
            store.eventHandler.subscribe(handleChange);

            // Unsubscribe when the component is unmounted
            return () => {
                store.eventHandler.unsubscribe(handleChange);
            };
        }, []);

        useEffect(() => {
            console.log("useModel() modelId changed: ", modelId);
            const newModel = findModelById(store.collectionData, modelId) || null;
            if (model === newModel) return;
            setModel(newModel);
        }, [modelId]);

        // We make a function to set model data so that this hook works like useState for the user
        const setModelData = (newModel: Data) => {
            store.mergedController.set(newModel);
        };

        if (!modelId) {
            // console.log("useModel() called without modelId and no model is selected");
            return [null, () => { }];
        }
        return [initialModel, setModelData] as UseModelReturn<Data>;
    };
}

export default createUseModel;
