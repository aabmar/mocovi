import { useEffect, useState } from "react";
import { findModelById } from "./findModelIndexById";
import { nanoid } from "./nanoid";
import { Store, UseModel, UseModelReturn } from "./types";

function createUseModel<Data extends { id: string }>(store: Store<Data>): UseModel<Data> {

    let first: Data | null = null;

    return function useModel(modelId): UseModelReturn<Data> {


        if (modelId) first = findModelById(store.collectionData, modelId);

        // This state will be set to the component that uses this hook
        const [model, setModel] = useState<Data | null>(first);

        useEffect(() => {

            // Make a subscription to changes in the data
            function handleChange(d: Data[]) {
                // if (!modelId) return;
                const newModel = modelId ? findModelById(d, modelId) : null;

                console.log("useModel: handleChange: ", model?.id, newModel?.id, model === newModel);
                if (model === newModel) return;
                // TODO: optimize can be deep or level 1 compare

                setModel(newModel);
                first = newModel;
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

        return [model, setModelData] as UseModelReturn<Data>;
    };
}

export default createUseModel;
