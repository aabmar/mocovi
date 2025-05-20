import { useEffect, useRef, useState } from "react";
import { findModelById } from "./findModelIndexById";
import { nanoid } from "./nanoid";
import { Model, Store, UseModel, UseModelReturn } from "./types";
import { getStore } from "./Store";
import logger, { LOG_LEVEL_DEBUG } from "./logger";
const { log, err, dbg, level } = logger("useStore");
level(LOG_LEVEL_DEBUG);

type UseStoreReturn<Data> = {
    collection: Map<string, Data>,
    model: Data | null,
    setModel: (model: Data) => boolean,
    setField: (id: string, field: keyof Data, value: any) => boolean,
    setCollection: (collection: Data[]) => boolean,
} | undefined;

type Mode = "collection" | "model";

function useStore<Data extends Model>(storeId: string, modelId?: string, fields?: string[]): UseStoreReturn<Data> {

    //
    // HOOKS
    //

    const [changeCount, setChangeCount] = useState(0);

    const ref = useRef<{
        storeId: string,
        mode: Mode,
        store: Store<Data>,
        modelId: string | null,
        collection: Map<string, any> | null,
        model: { [key: string]: any } | null,
        fields: string[] | null
    }>({
        storeId: storeId,
        mode: modelId ? "model" : "collection",
        store: getStore(storeId),
        modelId,
        collection: null,
        model: null,
        fields: null
    });

    // Functions

    const setModel = (model: Data) => {
        ref.current.store.baseController.set(model);
        return true;
    };

    const setField = (id: string, field: keyof Data, value: any) => {
        ref.current.store.baseController.setField(id, field, value);
        return true;
    };

    const setCollection = (collection: Data[]) => {
        if (!ref.current.store) {
            log("useStore: setCollection: no store found");
            return false;
        }
        ref.current.store.baseController.setCollection(collection);
        return true;
    };

    // DATA

    // Check if the store exists
    if (!storeId || storeId !== ref.current.storeId) {
        err("useStore: Invalid storeId: ", storeId, " ref: ", ref.current.storeId);
        return undefined;
    }

    // Check if we have a collection
    if (!ref.current.collection) {
        log("useStore: no collection found");
        return undefined;
    }

    // Now we are goint to handle things differently depending on the mode

    if (ref.current.mode === "collection") {
        return {
            collection: ref.current.collection,
            model: null,
            setModel: setModel,
            setField: setField,
            setCollection: setCollection
        }

        const mode = modelId ? MODE_MODEL : MODE_COLLECTION;

        const data = collection.baseController.getInternalStorage();
        const model = modelId ? data.get(modelId) : null;

        if (MODE_COLLECTION) {
            if (data != "")
    }




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

            collection.eventHandler.subscribe(handleChange);

            // Unsubscribe when the component is unmounted
            return () => {
                collection.eventHandler.unsubscribe(handleChange);
            };
        }, []);

        const setModelData = (newModel: Data) => {
            if (!newModel.id) {
                newModel.id = nanoid();
            }
            collection.baseController.set(newModel);
        };

        return {
            collection: ref.current.collection,
            model: ref.current.model,
            setModel: setModelData,
            setField: (field: string, value: any) => {
                return false;
            }
        }
    }
