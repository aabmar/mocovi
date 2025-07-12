import { useEffect, useState, useCallback } from "react";
import useLog, { LOG_LEVEL_DEBUG } from "./logger";
import { nanoid } from "./nanoid";
import { Store, UseSelected, UseSelectedReturn } from "./types";
import { isDifferent } from "./util";

const { log, dbg, level } = useLog("createUseSelected");

level(LOG_LEVEL_DEBUG);

function createUseSelected<Data extends { id: string }>(store: Store<Data>): UseSelected<Data> {

    /**
     * @deprecated This hook is deprecated and will be removed in a future version.
     * Please use the new useStore hook instead with the appropriate filter.
     */
    function useSelected() {

        // The local state data
        const [selected, setSelected] = useState(store.baseController.getSelected());

        const handleChange = useCallback((d: Data[]) => {
            const newModel = store.baseController.getSelected();

            // Compare new model with the previously rendered selected model
            if (isDifferent(newModel, selected)) {
                dbg("Model in state is different from the current selected model, updating state");
                setSelected(newModel);
            }
        }, [store.id, selected, setSelected]); // Depend on selected to capture the last rendered value

        // On mount, we subscribe to the event handler
        // and we unsubscribe on unmount
        useEffect(() => {
            store.eventHandler.subscribe(handleChange);
            return () => {
                store.eventHandler.unsubscribe(handleChange);
            };
        }, [handleChange]);


        // We make a function to set model data so that this hook works like useState for the user.
        // It will call add() on the controller if the model is not found, otherwise it will call set()
        const setModelData = (newModel: Data) => {
            if (!newModel.id) {
                newModel.id = nanoid();
            }

            store.mergedController.set(newModel);
        };


        return [selected, setModelData] as UseSelectedReturn<Data>;
    }

    return useSelected;
}

export default createUseSelected;
