import { useEffect, useState } from "react";
import { findModelById, findModelIndexById } from "./findModelIndexById";
import { Store } from "./Store";
import { nanoid } from "nanoid/non-secure";

export type UseSelectedReturn<Data> = [Data | null, (model: Data) => void];
export type UseSelected<Data> = () => UseSelectedReturn<Data>;

function createUseSelected<Data extends { id: string }>(store: Store<Data>): UseSelected<Data> {

    function useSelected() {

        const selectedModel = findModelById(store.collectionData, store.selectedModelId);

        // The local state data
        const [model, setModel] = useState<Data | null>(selectedModel);

        useEffect(() => {

            function handleChange(d: Data[]) {

                const newModel = findModelById(d, store.selectedModelId);
                if (model === newModel) return;
                // TODO: optimize can be deep or level 1 compare
                setModel(newModel);
            }

            store.eventHandler.subscribe(handleChange);

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

        return [model, setModelData] as UseSelectedReturn;
    }

    return useSelected;
}

export default createUseSelected;
