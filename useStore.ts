import { useCallback, useEffect, useMemo, useState } from "react";
import { getStore } from "./Store";
import logger, { LOG_LEVEL_DEBUG } from "./logger";
import { nanoid } from "./nanoid";
import { BaseController, Model, Store, UseStoreReturn } from "./types";
import createUseCom from "./useCom";
import { isDifferent } from "./util";
const { log, err, dbg, level } = logger("useStore");

// level(LOG_LEVEL_DEBUG);

/**
 * Hook for accessing a collection of models
 * Returns an object with the collection, functions to update the collection and models,
 * and the controller for advanced operations
 * Component will re-render on any change in the collection
 */
function useStore<Data extends Model>(storeId: string): UseStoreReturn<Data>;

/**
 * Hook for accessing models filtered by ID or criteria
 * Returns an object with the filtered collection, functions to update the collection and models,
 * and the controller for advanced operations
 * Component will re-render on any change in the matching models
 * If filter is a string, it's treated as an ID filter (returns an array of 1 or 0 items)
 * If filter is an object, it's used to filter by multiple properties
 * If filter is null, it returns an empty array. In React, hooks need to be constant, so if the component doesn't have the ID of the model yet, it will not fail.
 */
function useStore<Data extends Model>(
    storeId: string,
    filter: string | Partial<Record<keyof Data, string | RegExp>> | null
): UseStoreReturn<Data>;

/**
 * Hook for accessing models filtered by ID or criteria and sorted by a key
 * Returns an object with the filtered and sorted collection, functions to update the collection and models,
 * and the controller for advanced operations
 * Component will re-render on any change in the matching models.
 * filter can be a string (then checking the field named "id"), an object ("key" : "search value" | Regex), or null (empty collection).
 */
function useStore<Data extends Model>(
    storeId: string,
    filter: string | Partial<Record<keyof Data, string | RegExp>> | null,
    sort: keyof Data | ((a: Data, b: Data) => number)
): UseStoreReturn<Data>;

/**
 * Implementation of the useStore hook
 */
function useStore<Data extends Model>(
    storeId: string,
    filter?: string | Partial<Record<keyof Data, string | RegExp>>,
    sort?: keyof Data | ((a: Data, b: Data) => number)
): UseStoreReturn<Data> & { useCom: ReturnType<typeof createUseCom<Data>> } {


    // Get the store
    const store = useMemo(() => getStore(storeId) as Store<Data> | undefined, [storeId]);

    if (!store) {
        err(`Store with ID '${storeId}' not found`);
        throw new Error(`Store with ID '${storeId}' not found`);
    }

    // Normalize filter - convert string ID to object filter
    let parsedFilter: Partial<Record<keyof Data, string | RegExp>> | null = null;
    if (typeof filter === 'string') {
        parsedFilter = { id: filter } as Partial<Record<keyof Data, string | RegExp>>;
    } else if (filter === null) {
        parsedFilter = null;
    } else {
        parsedFilter = filter;
    }


    // This do not identify the filer correctly if regex is used, so make a clone of the filter 
    // and if a value is regex, convert it to its string representation before stringifying
    const filterClone: Partial<Record<keyof Data, string | RegExp>> = {};
    for (const key in parsedFilter) {
        const value = parsedFilter[key];
        if (value instanceof RegExp) {
            filterClone[key] = value.toString(); // Convert RegExp to string representation
        } else {
            filterClone[key] = value; // Keep other values as is
        }
    }
    // Use the clone for JSON.stringify
    const filterString = (parsedFilter === null ? "null" : JSON.stringify(filterClone));


    log("Using filter: ", filterString, " and sortByKey: ", sort, " in store: ", storeId);

    // Create a function that applies filtering and sorting to data
    const processData = useCallback((data: Data[]): Data[] => {
        if (parsedFilter === null) return [];

        let result = [...data];

        // Apply filtering if filter is defined
        if (parsedFilter) {
            result = result.filter(model => {
                return Object.entries(parsedFilter).every(([key, value]) => {
                    if (value instanceof RegExp) {
                        return value.test(String(model[key as keyof Data]));
                    }
                    return model[key as keyof Data] === value;
                });
            });

            dbg("Search Result on store: ", storeId, ":", result);

        }

        // Apply sorting if sortByKey is defined
        if (sort) {
            if (typeof sort === 'function') {
                result.sort(sort);
            } else {
                result.sort((a, b) => {
                    const aValue = a[sort];
                    const bValue = b[sort];

                    if (typeof aValue === 'string' && typeof bValue === 'string') {
                        return aValue.localeCompare(bValue);
                    }

                    if (aValue < bValue) return -1;
                    if (aValue > bValue) return 1;
                    return 0;
                });
            }
        }

        return result;
    }, [parsedFilter, sort]);



    // State for the filtered collection
    const [collection, setCollectionState] = useState<Data[]>(() => {
        const fullCollection = store.baseController.getCollection();
        const processedData = processData(fullCollection);
        return processedData;
    });

    // Callback to call when the collection changes
    const handleCollectionChange = useCallback((data: Data[]) => {
        dbg(`Collection changed in store '${storeId}', processing with filter and sort`);
        const processedData = processData(data);
        if (isDifferent(collection, processedData)) {
            log(`Collection changed after reprocessing, updating state: `, storeId, processedData.length);
            setCollectionState(processedData);
        }
    }, [storeId, processData]);

    // Subscribe to collection changes
    useEffect(() => {
        dbg(`Subscribing to collection changes in store '${storeId}'`);
        store.eventHandler.subscribe(handleCollectionChange);

        return () => {
            dbg(`Unsubscribing from collection changes in store '${storeId}'`);
            store.eventHandler.unsubscribe(handleCollectionChange);
        };
    }, []); // no dependencies, subscribe is done once

    // Do filter again if it changes
    useEffect(() => {
        dbg(`Reprocessing collection in store '${storeId}' due to filter change`);
        const fullCollection = store.baseController.getCollection();
        const processedData = processData(fullCollection);
        if (isDifferent(collection, processedData)) {
            dbg(`Collection changed after reprocessing, updating state`);
            setCollectionState(processedData);
        }
    }, [filterString, sort, store]);

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

    // Add useCom to the return type
    const useCom = useMemo(() => createUseCom<Data>(store), [store]);

    dbg("returning store data: ", collection);

    const model = collection.length > 0 ? collection[0] : null;

    return {
        collection,
        setCollection,
        setModel,
        controller: store.baseController,
        useCom,
        model
    };
}

export default useStore;
