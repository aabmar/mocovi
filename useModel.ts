import { useEffect, useState } from "react";
import { findModelIndexById, findModelById } from "./findModelIndexById";
import { Store } from "./Store";
import { nanoid } from "nanoid/non-secure";

export type UseModelReturn<Data extends { id: string }> = [Data | null, (newModel: Data) => void];
export type UseModel<Data extends { id: string }> = (modelId: string | null) => UseModelReturn<Data>;

let prevId = "";

function createUseModel<Data extends { id: string }>(store: Store<Data>): UseModel<Data> {
    return function useModel(modelId): UseModelReturn<Data> {

        // console.log("useModel() called with modelId: ", modelId);

        if (modelId === null) {
            modelId = store.selectedModelId;
            console.log("useModel() ", store.id, " called with modelId: null, using selectedModelId: ", modelId);

            // if (modelId === null) {
            //     console.error("useModel() ", store.id, " called with modelId: null and no model is selected. We create a new model.");
            //     modelId = nanoid();
            //     const newModel = { id: modelId } as Data;
            //     store.mergedController.add(newModel);
            // }
        }

        // If this is the first time, we set the previous ID
        if (!prevId && modelId) {
            prevId = modelId;
        }

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
            if (prevId === modelId) return;
            console.log("useModel() ", store.id + " modelId changed: ", modelId);
            const newModel = findModelById(store.collectionData, modelId) || null;
            if (model === newModel) return;
            prevId = modelId;
            setModel(newModel);
        }, [modelId]);

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

        if (!modelId) {
            // console.log("useModel() called without modelId and no model is selected");
            return [null, () => { }];
        }
        return [initialModel, setModelData] as UseModelReturn<Data>;
    };
}

export default createUseModel;
