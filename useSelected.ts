import { useEffect, useState } from "react";
import { findModelById, findModelIndexById } from "./findModelIndexById";
import { nanoid } from "./nanoid";
import { UseSelected, Store, UseSelectedReturn } from "./types";


function createUseSelected<Data extends { id: string }>(store: Store<Data>): UseSelected<Data> {

    function useSelected() {

        let first: Data | null = store.selectedModelId ? store.baseController.getSelected() : null;

        // The local state data
        const [model, setModel] = useState<Data | null>(first);

        useEffect(() => {

            function handleChange(d: Data[]) {

                const newModel = findModelById(d, store.selectedModelId);
                // console.log("useSelected: handleChange: ", model?.id, newModel?.id, model === newModel);
                if (model === newModel) return;
                // TODO: optimize can be deep or level 1 compare
                setModel(newModel);
                first = newModel;
            }

            store.eventHandler.subscribe(handleChange);

            return () => {
                store.eventHandler.unsubscribe(handleChange);
            };
        }, []);


        // We make a function to set model data so that this hook works like useState for the user.
        // It will call add() on the controller if the model is not found, otherwise it will call set()
        const setModelData = (newModel: Data) => {
            if (!newModel.id) {
                newModel.id = nanoid();
            }

            store.mergedController.set(newModel);
        };

        return [model, setModelData] as UseSelectedReturn<Data>;
    }

    return useSelected;
}

export default createUseSelected;
