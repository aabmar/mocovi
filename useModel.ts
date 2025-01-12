import { useEffect, useState } from "react";
import { findModelIndexById, findModelById } from "./findModelIndexById";
import { Model, Store } from "./Store";
import { nanoid } from "./nanoid";

export type UseModelReturn<Data extends { id: string }> = [Data | null, (newModel: Data) => void];
export type UseModel<Data extends { id: string }> = (modelId: string | undefined) => UseModelReturn<Data>;

//let prevId: string | null = "";

function createUseModel<Data extends { id: string }>(store: Store<Data>): UseModel<Data> {
    return function useModel(modelId): UseModelReturn<Data> {


        // Find the initial model based on the modelId
        let initialModel: Data | null = null;
        if (modelId) initialModel = findModelById(store.collectionData, modelId);

        // This state will be set to the component that uses this hook
        const [model, setModel] = useState<Data | null>(initialModel);

        useEffect(() => {

            // Make a subscription to changes in the data
            function handleChange(d: Data[]) {
                // if (!modelId) return;
                const newModel = modelId ? findModelById(d, modelId) : null;

                if (model === newModel) return;
                // TODO: optimize can be deep or level 1 compare

                setModel(newModel);
            }
            store.eventHandler.subscribe(handleChange);

            // Unsubscribe when the component is unmounted
            return () => {
                store.eventHandler.unsubscribe(handleChange);
            };
        }, []);

        // We make a function to set model data so that this hook works like useState for the user.
        // It will call add() on the controller if the model is not found, otherwise it will call set()
        const setModelData = (newModel: Data) => {
            if (newModel.id.length === 0) {
                newModel.id = nanoid();
            }
            if (findModelById(store.collectionData, newModel.id) === null) {
                store.mergedController.add(newModel);
            } else {
                store.mergedController.set(newModel);
            }
        };

        return [initialModel, setModelData] as UseModelReturn<Data>;
    };
}

export default createUseModel;
