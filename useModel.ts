import { useEffect, useState } from "react";
import { findModelById } from "./findModelIndexById";
import { nanoid } from "./nanoid";
import { Store, UseModel, UseModelReturn } from "./types";

function createUseModel<Data extends { id: string }>(store: Store<Data>): UseModel<Data> {

    /**
     * @deprecated This hook is deprecated and will be removed in a future version.
     * Please use the new useStore hook instead:
     * const { collection } = useStore<Data>("storeId", "modelId");
     * Where collection[0] contains the model (if found).
     */
    return function useModel(modelId): UseModelReturn<Data> {

        let first: Data | null = store.baseController.get(modelId);

        // This state will be set to the component that uses this hook
        const [model, setModel] = useState<Data | null>(first);

        // Make a subscription to changes in the data
        function handleChange(d: Data[]) {

            const newModel = modelId ? findModelById(d, modelId) : null;

            console.log("useModel: handleChange: ", model?.id, newModel?.id, model === newModel);
            if (first === newModel) return;
            // TODO: optimize can be deep or level 1 compare

            setModel(newModel);
        }

        useEffect(() => {

            // if (modelId !== model?.id) {
            //     const m = store.baseController.get(modelId);
            //     setModel(m);
            // }

            store.eventHandler.subscribe(handleChange);

            // Unsubscribe when the component is unmounted
            return () => {
                store.eventHandler.unsubscribe(handleChange);
            };
        }, []);

        const setModelData = (newModel: Data) => {
            if (!newModel.id) {
                newModel.id = nanoid();
            }
            store.baseController.set(newModel);
        };

        return [first, setModelData] as UseModelReturn<Data>;
    };
}

export default createUseModel;
