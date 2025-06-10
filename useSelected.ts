import { useEffect, useState } from "react";
import useLog from "./logger";
import { nanoid } from "./nanoid";
import { Store, UseSelected, UseSelectedReturn } from "./types";

const { log, dbg, level } = useLog("createUseSelected");

// level(LOG_LEVEL_DEBUG);

function createUseSelected<Data extends { id: string }>(store: Store<Data>): UseSelected<Data> {

    /**
     * @deprecated This hook is deprecated and will be removed in a future version.
     * Please use the new useStore hook instead with the appropriate filter.
     */
    function useSelected() {

        // The local state data
        const [changed, setChanged] = useState(0);


        let selected = store.baseController.getSelected();

        dbg("& USE SELECTED ", changed, " STORE: ", store.id, " SELECTED: ", (selected ? selected.id : "NONE"));

        function handleChange(d: Data[]) {

            const newModel = store.baseController.getSelected();
            dbg("&& 1) HANDLE CHANGE USE SELECTED ", store.id, changed, "Changed: ", newModel !== selected, (selected ? selected.id : "NONE"), (newModel ? newModel.id : "NONE"));
            if (newModel !== selected) {
                dbg("&& 2) HANDLE CHANGE USE SELECTED ", store.id, changed, "Changed: ", newModel !== selected, (selected ? selected.id : "NONE"), (newModel ? newModel.id : "NONE"), changed);
                setChanged((prev: number) => {
                    dbg("&& 3) HANDLE CHANGE USE SELECTED ", store.id, changed, "Changed: ", newModel !== selected, (selected ? selected.id : "NONE"), (newModel ? newModel.id : "NONE"), prev);
                    return prev + 1;
                });
            }
        }

        // On mount, we subscribe to the event handler
        // and we unsubscribe on unmount
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


        return [selected, setModelData] as UseSelectedReturn<Data>;
    }

    return useSelected;
}

export default createUseSelected;
