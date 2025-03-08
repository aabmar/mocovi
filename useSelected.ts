import { useEffect, useState } from "react";
import { findModelById, findModelIndexById } from "./findModelIndexById";
import { nanoid } from "./nanoid";
import { UseSelected, Store, UseSelectedReturn } from "./types";
import useLog, { LOG_LEVEL_DEBUG } from "./logger";

const { log, dbg, level } = useLog("createUseSelected");

level(LOG_LEVEL_DEBUG);

function createUseSelected<Data extends { id: string }>(store: Store<Data>): UseSelected<Data> {

    function useSelected() {

        // The local state data
        const [changed, setChanged] = useState(0);


        let selected = store.baseController.getSelected();

        dbg("& USE SELECTED ", changed, " STORE: ", store.id, " SELECTED: ", (selected ? selected.id : "NONE"));

        function handleChange(d: Data[]) {

            const newModel = store.baseController.getSelected();
            log("&& USE SELECTED HANDLE CHANGE ", store.id, "Changed: ", newModel !== selected, (selected ? selected.id : "NONE"), (newModel ? newModel.id : "NONE"));
            if (newModel !== selected) {
                setChanged((prev: number) => {
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
