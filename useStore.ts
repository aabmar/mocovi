import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { findModelById } from "./findModelIndexById";
import { nanoid } from "./nanoid";
import { Model, Store } from "./types";
import { getStore } from "./Store";
import logger from "./logger";
const { log, err, dbg } = logger("useStore");

/**
 * Hook for accessing a collection of models
 * Returns an object with the collection
 * Component will re-render on any change in the collection
 */
function useStore<Data extends Model>(storeId: string): {
    collection: Data[],
    setCollection: (collection: Data[]) => void
};

/**
 * Hook for accessing a specific model by ID
 * Returns an object with the model
 * Component will re-render on any change in the model
 */
function useStore<Data extends Model>(storeId: string, modelId: string): {
    model: Data | null,
    setModel: (model: Data) => void
};

/**
 * Hook for accessing a specific model by ID with field-specific updates
 * Returns an object with the model
 * Component will re-render only when specified fields change
 */
function useStore<Data extends Model>(storeId: string, modelId: string, fields: (keyof Data)[]): {
    model: Data | null,
    setModel: (model: Data) => void
};

/**
 * Implementation of the useStore hook
 */
function useStore<Data extends Model>(
    storeId: string,
    modelId?: string,
    fields?: (keyof Data)[]
): { collection: Data[], setCollection: (collection: Data[]) => void } |
    { model: Data | null, setModel: (model: Data) => void } {

    // Get the store
    const store = useMemo(() => getStore(storeId) as Store<Data> | undefined, [storeId]);

    if (!store) {
        err(`Store with ID '${storeId}' not found`);
        throw new Error(`Store with ID '${storeId}' not found`);
    }

    // COLLECTION MODE
    if (!modelId) {
        // State for the collection
        const [collection, setCollectionState] = useState<Data[]>(
            store.baseController.getCollection()
        );

        // Handler for collection changes
        const handleCollectionChange = useCallback((data: Data[]) => {
            dbg(`Collection changed in store '${storeId}', length: ${data.length}`);
            setCollectionState(data);
        }, [storeId]);

        // Subscribe to collection changes
        useEffect(() => {
            dbg(`Subscribing to collection changes in store '${storeId}'`);
            store.eventHandler.subscribe(handleCollectionChange);

            return () => {
                dbg(`Unsubscribing from collection changes in store '${storeId}'`);
                store.eventHandler.unsubscribe(handleCollectionChange);
            };
        }, [store, handleCollectionChange, storeId]);

        // Function to update the collection
        const setCollection = useCallback((newCollection: Data[]) => {
            dbg(`Setting collection in store '${storeId}', length: ${newCollection.length}`);
            store.baseController.setCollection(newCollection);
        }, [store, storeId]);

        return { collection, setCollection };
    }

    // MODEL MODE or FIELD MODE
    const initialModel = useMemo(() =>
        store.baseController.get(modelId), [store, modelId]);

    // State for the model
    const [model, setModelState] = useState<Data | null>(initialModel);

    // Handler for model changes
    const handleModelChange = useCallback((data: Data[]) => {
        const newModel = findModelById(data, modelId);

        // For both modes: handle null cases consistently
        if (model === null && newModel === null) return;

        // If model became null or appeared from null, always update
        if (model === null || newModel === null) {
            dbg(`Model '${modelId}' ${newModel ? 'appeared' : 'disappeared'} in store '${storeId}'`);
            setModelState(newModel);
            return;
        }

        // MODEL MODE - No fields specified, update whenever the model changes
        if (!fields) {
            if (model !== newModel) {
                dbg(`Model '${modelId}' changed in store '${storeId}'`);
                setModelState(newModel);
            }
            return;
        }

        // FIELD MODE - Check if any of the specified fields changed
        const hasChanges = fields.some(field => {
            const fieldName = field as string;
            return model[fieldName] !== newModel[fieldName];
        });

        if (hasChanges) {
            dbg(`Fields [${fields.join(", ")}] changed in model '${modelId}' in store '${storeId}'`);
            setModelState(newModel);
        }
    }, [store, storeId, modelId, model, fields]);

    // Subscribe to model changes
    useEffect(() => {
        dbg(`Subscribing to model changes for '${modelId}' in store '${storeId}'`);
        store.eventHandler.subscribe(handleModelChange);

        return () => {
            dbg(`Unsubscribing from model changes for '${modelId}' in store '${storeId}'`);
            store.eventHandler.unsubscribe(handleModelChange);
        };
    }, [store, handleModelChange, storeId, modelId]);

    // Function to update the model
    const setModel = useCallback((newModel: Data) => {
        dbg(`Setting model '${modelId}' in store '${storeId}'`);

        // Ensure the model has an ID
        if (!newModel.id) {
            newModel.id = nanoid();
            dbg(`Generated new ID '${newModel.id}' for model`);
        }

        store.baseController.set(newModel);
    }, [store, storeId, modelId]);

    return { model, setModel };
}

export default useStore;
