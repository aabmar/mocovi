import React, { useEffect, useState } from "react";
import { createEventHandler } from "./Event";
import { PayloadSetField, PayloadSync, Store, StoreAction, StoreCreateController, StoreDispatch, StoreOptions, UseController, UseData, UseDispatch, UseStore } from "./Store";
import { stores } from "./Store";
import getObjectByKey  from './getObjectByKey';

// Global data store that updates components when data changes.
// Data is mutable, and is updated by calling setState on components
// that has been subscribed by using useStore()


//
// Hook for using the store
//

let storeCounter = 0;

function createStore<Data, Controller = null>(id: string, defaultDdata: Data, options?: StoreOptions<Data, Controller>): Store<Data, Controller> {
    let store = stores.get(id);
    if (!store) {
        store = create<Data, Controller>(id, defaultDdata, options);
        stores.set(id, store);
        console.log("%% useCreateStore() new store: ", id);
    } else {
        console.log("%% useCreateStore() existing store: ", id);
    }

    return store;
}

function create<Data, Controller>(id: string, defaultDdata: Data, options?: StoreOptions<Data, Controller>): Store<Data, Controller> {
    console.log("useCreateStore() creating store: ", id, "create count: ", storeCounter++);

    const internalData = {
        data: defaultDdata,
        id: id
    };

    const eventHandler = createEventHandler<Data>();

    const dispatch: StoreDispatch<Data> = async (action: (StoreAction<Data> | ((data: Data) => StoreAction<Data>))) => {

        // If the parameter is a function, call the function with the current store data
        // and then we call ourself again with the StoreAction that the function returns.
        if (typeof action === "function") {
            // console.log("useStore dispatch() function: ");
            const cb = action as (store: Data) => StoreAction<Data>;
            const a = cb(internalData.data);
            dispatch(a);
            return;
        }

        switch (action.type) {
            case "set":
                // console.log("dispatch() set: ", internalData.id, " - ", action.payload);
                let payload = action.payload;
                internalData.data = { ...internalData.data, ...payload };
                eventHandler.notify(internalData.data);
                break;
            case "field":
                // TODO: This code is messy now, testing the functionality. CLEAN IT UP!!
                const field = action.payload as PayloadSetField;
                const key: string = String(field.key);
                const value = field.value;
                const keys: string[] = key.split(".");

                // console.log("dispatch() field: ", internalData.id, " - ", field, "keys: ", keys, " value: ", value?.length);

                if (keys.length == 1) {
                    internalData.data = { ...internalData.data, [key]: value };
                    eventHandler.notify(internalData.data);
                } else {
                    const path = [...keys];

                    // The last key is the field name so we move it from the last entry to a separate variable
                    const fieldName = path.pop();
                    if (!fieldName) {
                        throw new Error("Path to short, must be at least object key and fieldname " + key);
                    }

                    // The second to last is the object that we want to update, so we move that out as well
                    let destinationKey = path.pop();
                    if (!destinationKey) {
                        throw new Error("Path to short, must be at least object key and fieldname " + key);
                    }

                    // We get the object that we want to update.
                    // If the path now is empty, we update the root object.
                    let destinationRoot: any;
                    if (path.length == 0) {
                        destinationRoot = internalData.data;
                    } else {
                        destinationRoot = getObjectByKey(internalData.data, path);
                    }

                    // If key has a $ prefix, we look for an object with id equal to the value
                    // and replace the destinationKey with the actual key of that object                        
                    if (destinationKey.startsWith("$")) {
                        const id = destinationKey.substring(1);
                        for (let key in destinationRoot) {
                            if (destinationRoot[key].id === id) {
                                destinationKey = key;
                                break;
                            }
                        }
                    }

                    // Now we are ready to update the object.
                    // If the destinationRoot is an array, we use the index as key
                    let index;
                    if (Array.isArray(destinationRoot)) {
                        index = parseInt(destinationKey);
                    } else {
                        index = destinationKey;
                    }

                    // Update the object
                    destinationRoot[index] = { ...destinationRoot[index], [fieldName]: value };

                    // Notify the subscribers
                    eventHandler.notify(internalData.data);
                }
                break;
            case "nop":
                break;
            default:
                throw new Error("Unknown action type: " + action.type);
        }
    }

    // If the createController function is defined, we call it with the internal data and the dispatch function.
    // If it has an init function, we call that as well.
    type ControllerWithInit = Controller & { init?: () => Promise<void> };
    let controller: ControllerWithInit | undefined = options?.createController ? options.createController(internalData, dispatch, eventHandler) as ControllerWithInit : undefined;

    // Call init if controller exists and init exists
    console.log("createsStore() check if controller and if controller: has init ", controller?.init && controller.init);
    if(controller?.init && controller.init){
        console.log("createsStore() calling controller init");

        // Init can't return anything because is async, but we are not
        controller.init();
    }
    

    const useStore: UseStore<Data> = () => {

        // console.log("useStore() called with store: ", internalData.id, " and data: ", internalData.data ? internalData.data.id : "null");

        const [data, setData] = useState<Data>(internalData.data);

        useEffect(() => {
            function handleChange(data: Data) {
                setData(() => data);
            }
            // setData(data_);
            eventHandler.subscribe(handleChange);
            return () => {
                eventHandler.unsubscribe(handleChange);
            }
        }, []);


        return [data, dispatch];
    }
    const useData: UseData = (key: string) => {

        const [data, setData] = useState<any>(getObjectByKey(internalData.data, key));

        useEffect(() => {
            function handleChange(d: Data) {
                const filtered = getObjectByKey(d, key);
                setData(filtered);
            }
            eventHandler.subscribe(handleChange);
            return () => {
                eventHandler.unsubscribe(handleChange);
            }
        }, []);
        return data;
    }

    const useController: UseController<Controller> = () => {
        if (!controller) {
            throw new Error("Controller not defined");
        }
        return controller;
    }

    const useDispatch: UseDispatch<Data> = () => {
        return dispatch;
    }

    const st: Store<Data, Controller> = { useStore, useData, controller, useController, useDispatch, dispatch };

    return st;
}

export default createStore;
