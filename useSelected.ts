import { useEffect, useState } from "react";
import { findModelById, findModelIndexById } from "./findModelIndexById";
import { nanoid } from "./nanoid";
import { UseSelected, Store, UseSelectedReturn } from "./types";
import useLog from "./logger";

function createUseSelected<Data extends { id: string }>(store: Store<Data>): UseSelected<Data> {
    const { log, dbg } = useLog("createUseSelected");

    function useSelected() {

        // The local state data
        const [model, setModel] = useState<Data | null>(null);

        function handleChange(d: Data[]) {

            const newModel = store.baseController.getSelected();
            dbg("useSelected: handleChange: ", model?.id, newModel?.id, model === newModel);
            // if (model === newModel) return;

            setModel(newModel);
            // first = newModel;s
        }

        useEffect(() => {

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

        const selected = store.baseController.getSelected();


        return [selected, setModelData] as UseSelectedReturn<Data>;
    }

    return useSelected;
}

export default createUseSelected;
