import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { findModelById } from "./findModelIndexById";
import { nanoid } from "./nanoid";
import { Model, Store } from "./types";
import { getStore } from "./Store";
import logger from "./logger";
const { log, err, dbg } = logger("useStore");

/**
 * Hook for accessing a collection of models
 * Returns an object with the collection and functions to update the collection and models
 * Component will re-render on any change in the collection
 */
function useStore<Data extends Model>(storeId: string): {
    collection: Data[],
    setCollection: (collection: Data[]) => void,
    setModel: (model: Data) => void
};

/**
 * Hook for accessing models filtered by ID or criteria
 * Returns an object with the filtered collection and functions to update the collection and models
 * Component will re-render on any change in the matching models
 * If modelIdOrFilter is a string, it's treated as an ID filter (returns an array of 1 or 0 items)
 * If modelIdOrFilter is an object, it's used to filter by multiple properties
 */
function useStore<Data extends Model>(
    storeId: string,
    modelIdOrFilter: string | Partial<Record<keyof Data, string | RegExp>>
): {
    collection: Data[],
    setCollection: (collection: Data[]) => void,
    setModel: (model: Data) => void
};

/**
 * Hook for accessing models filtered by ID or criteria and sorted by a key
 * Returns an object with the filtered and sorted collection and functions to update the collection and models
 * Component will re-render on any change in the matching models
 */
function useStore<Data extends Model>(
    storeId: string,
    modelIdOrFilter: string | Partial<Record<keyof Data, string | RegExp>>,
    sortByKey: keyof Data
): {
    collection: Data[],
    setCollection: (collection: Data[]) => void,
    setModel: (model: Data) => void
};

/**
 * Implementation of the useStore hook
 */
function useStore<Data extends Model>(
    storeId: string,
    modelIdOrFilter?: string | Partial<Record<keyof Data, string | RegExp>>,
    sortByKey?: keyof Data
): {
    collection: Data[],
    setCollection: (collection: Data[]) => void,
    setModel: (model: Data) => void
} {
    // Get the store
    const store = useMemo(() => getStore(storeId) as Store<Data> | undefined, [storeId]);

    if (!store) {
        err(`Store with ID '${storeId}' not found`);
        throw new Error(`Store with ID '${storeId}' not found`);
    }

    // Normalize filter - convert string ID to object filter
    const filter = useMemo(() => {
        if (typeof modelIdOrFilter === 'string') {
            return { id: modelIdOrFilter } as Partial<Record<keyof Data, string | RegExp>>;
        }
        return modelIdOrFilter;
    }, [modelIdOrFilter]);

    // Create a function that applies filtering and sorting to data
    const processData = useCallback((data: Data[]): Data[] => {
        let result = [...data];

        // Apply filtering if filter is defined
        if (filter) {
            result = result.filter(model => {
                return Object.entries(filter).every(([key, value]) => {
                    if (value instanceof RegExp) {
                        return value.test(String(model[key as keyof Data]));
                    }
                    return model[key as keyof Data] === value;
                });
            });
        }

        // Apply sorting if sortByKey is defined
        if (sortByKey) {
            result.sort((a, b) => {
                const aValue = a[sortByKey];
                const bValue = b[sortByKey];

                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return aValue.localeCompare(bValue);
                }

                if (aValue < bValue) return -1;
                if (aValue > bValue) return 1;
                return 0;
            });
        }

        return result;
    }, [filter, sortByKey]);

    // Get initial data with filtering and sorting applied
    const initialData = useMemo(() => {
        const fullCollection = store.baseController.getCollection();
        return processData(fullCollection);
    }, [store, processData]);

    // State for the filtered collection
    const [collection, setCollectionState] = useState<Data[]>(initialData);

    // Handler for collection changes
    const handleCollectionChange = useCallback((data: Data[]) => {
        dbg(`Collection changed in store '${storeId}', processing with filter and sort`);
        const processedData = processData(data);
        setCollectionState(processedData);
    }, [storeId, processData]);

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

    // Function to update a single model
    const setModel = useCallback((model: Data) => {
        dbg(`Setting model in store '${storeId}'`);

        // Ensure the model has an ID
        if (!model.id) {
            model.id = nanoid();
            dbg(`Generated new ID '${model.id}' for model`);
        }

        store.baseController.set(model);
    }, [store, storeId]);

    return { collection, setCollection, setModel };
}

export default useStore;
