import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import logger, { LOG_LEVEL_DEBUG } from "../lib/logger";
import { nanoid } from "../lib/nanoid";
import { Model, Store, UseStoreReturn } from "../lib/types";
import createUseCom from "./useCom";
import { isDifferent } from "../lib/util";
import MocoviContext from "../ctx/MocoviContext";
const { log, err, dbg, level } = logger("useStore");

// level(LOG_LEVEL_DEBUG);


// function useStore<Data extends Model>(storeId: string): UseStoreReturn<Data>;

// /**
//  * Hook for accessing models filtered by ID or criteria
//  * Returns an object with the filtered collection, functions to update the collection and models,
//  * and the controller for advanced operations
//  * Component will re-render on any change in the matching models
//  * If filter is a string, it's treated as an ID filter (returns an array of 1 or 0 items)
//  * If filter is an object, it's used to filter by multiple properties
//  * If filter is null, it returns an empty array. In React, hooks need to be constant, so if the component doesn't have the ID of the model yet, it will not fail.
//  */
// function useStore<Data extends Model>(
//     storeId: string,
//     filter: string | Partial<Record<keyof Data, string | RegExp>> | null
// ): UseStoreReturn<Data>;

// /**
//  * Hook for accessing models filtered by ID or criteria and sorted by a key
//  * Returns an object with the filtered and sorted collection, functions to update the collection and models,
//  * and the controller for advanced operations
//  * Component will re-render on any change in the matching models.
//  * filter can be a string (then checking the field named "id"), an object ("key" : "search value" | Regex), or null (empty collection).
//  */
// function useStore<Data extends Model>(
//     storeId: string,
//     filter: string | Partial<Record<keyof Data, string | RegExp>> | null,
//     sort: keyof Data | ((a: Data, b: Data) => number) | null
// ): UseStoreReturn<Data>;

// /**
//  * Hook for accessing models by ID and with re-render filter.
//  * It will return the model identified by ID as {model}.
//  * The eventFilter, if given, will only do a re-render (local state update) when
//  * the specified fields in Model is/are changed. Has to be an array.
//  */
// function useStore<Data extends Model>(
//     storeId: string,
//     id: string | null,
//     sort: keyof Data | ((a: Data, b: Data) => number) | null,
//     eventFilter: (keyof Data)[]
// ): UseStoreReturn<Data>;



/**
 * Hook for accessing a collection of models
 * Returns an object with the collection, functions to update the collection and models,
 * and the controller for advanced operations
 * Component will re-render on any change in the collection
 *
 * @param storeId ID of the store to access
 * @param filter Optional filter to apply to the collection. Can be a string (ID), an object (key-value pairs), undefined (no filter) or null (empty collection)
 * @param sort Optional sort criteria. Can be a key of Data or a compare function
 * @param fieldSelection Optional array of keys to filter re-renders. State will only update if one of these fields change in any of the models in the selected collection.
 * @returns An object with the filtered and sorted collection, functions to update the collection and models, and the controller for advanced operations
 */

function useStore<Data extends Model>(
    storeId: string,
    filter?: string | Partial<Record<keyof Data, string | RegExp>> | null | undefined,
    sort?: keyof Data | ((a: Data, b: Data) => number) | null | undefined,
    fieldSelection?: (keyof Data)[]

): UseStoreReturn<Data> {

    const mocovi = useContext(MocoviContext);
    // Set the last parameter to the correct variable based on type.

    // Get the store
    const store = mocovi.getStore(storeId);

    if (!store) {
        err(`Store with ID '${storeId}' not found`);
        throw new Error(`Store with ID '${storeId}' not found`);
    }

    const fs = JSON.stringify(filter || {});

    const { parsedFilter, filterString } = useMemo(() => {
        // Normalize filter - convert string ID to object filter
        let parsedFilter: Partial<Record<keyof Data, string | RegExp>> | null = null;
        if (typeof filter === 'string') {
            parsedFilter = { id: filter } as Partial<Record<keyof Data, string | RegExp>>;
        } else if (filter === null) {
            parsedFilter = null;
        } else {
            parsedFilter = filter;
        }

        // For use by memo / effect, we need a unique string representation of the filter
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
        return { parsedFilter, filterString };
    }, [fs]); // Only re-run if filter changes

    dbg("Using filter: ", filterString, " ( ", fs, " )", " and sortByKey: ", sort, " in store: ", storeId);

    // Create a function that applies filtering and sorting to data
    const processData = useCallback((data: Data[]): Data[] => {
        if (parsedFilter === null) return [];

        let result: Data[];

        // If we are looking for a specific ID, we can optimize by getting the model from
        // the controller instead of filtering the whole collection. The data is the same.
        if (parsedFilter && parsedFilter.id) {
            const model = store.baseController.get(parsedFilter.id as string);
            result = model ? [model] : [];
        } else {
            result = [...data];

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
                        const aValue = a[sort as keyof Data];
                        const bValue = b[sort as keyof Data];

                        if (typeof aValue === 'string' && typeof bValue === 'string') {
                            return aValue.localeCompare(bValue);
                        }

                        if (aValue < bValue) return -1;
                        if (aValue > bValue) return 1;
                        return 0;
                    });
                }
            }

            // if fieldSelection is defined, we iterate the result and only keep the specified
            // fields in each model. This is to limit re-renders to only when those fields change.
            if (fieldSelection) {
                result = result.map(model => {
                    const fsModel: Partial<Data> = {};
                    fieldSelection.forEach(key => {
                        if (model?.[key] !== undefined) {
                            fsModel[key] = model[key];
                        }
                    });
                    return fsModel as Data;
                });
            }

        }

        return result;
    }, [parsedFilter, sort, fieldSelection, store]);

    // State for the filtered collection
    const [collection, setCollectionState_] = useState<Data[]>(() => {
        const fullCollection = store.baseController.getCollection();
        const processedData = processData(fullCollection);
        return processedData;
    });

    // Wrapper to set collection state only if it changes
    const setCollectionState = useCallback((newCollection: Data[]) => {
        setCollectionState_(prevCollection => {
            if (isDifferent(prevCollection, newCollection)) {
                dbg(`Collection state UPDATED in store '${storeId}', old length: ${prevCollection.length}, new length: ${newCollection.length}`);
                return newCollection;
            }
            dbg(`Collection state NOT updated in store '${storeId}', old length: ${prevCollection.length}, new length: ${newCollection.length}`);
            return prevCollection; // No change
        });
    }, [setCollectionState_]);

    // Callback to call when the collection changes
    const handleCollectionChange = useCallback((data: Data[]) => {
        const processedData = processData(data);
        let a: {}[] = collection;
        let b: {}[] = processedData;

        dbg(`Collection changed in store '${storeId}', processing with filter and sort. Old length: ${collection.length}, new length: ${processedData.length}`);

        // // If we have a eventFilter, we will map out only the specified fields to a and b
        // // because only if those fields change we want to trigger an update
        // if (eventFilter) {
        //     const f: string[] = eventFilter as string[];
        //     a = a.map(item => f.reduce((acc, key) => {
        //         if (item.hasOwnProperty(key)) { // Optional: Check if the key exists
        //             acc[key] = item[key];
        //         }
        //         return acc;
        //     }, {}));
        //     b = b.map(item => f.reduce((acc, key) => {
        //         if (item.hasOwnProperty(key)) { // Optional: Check if the key exists
        //             acc[key] = item[key];
        //         }
        //         return acc;
        //     }, {}));
        // }

        setCollectionState(processedData);
    }, [storeId, processData, setCollectionState, collection, fieldSelection]);

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
        setCollectionState(processedData);

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
