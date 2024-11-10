import React, { useEffect, useContext, useState, createContext } from "react";
import { createEventHandler } from "./Event";
import { PayloadSetField, Store, StoreAction, StoreController, StoreCreateController, StoreDispatch, UseData, UseStore } from "./Store";

// Global data store that updates components when data changes.
// Data is mutable, and is updated by calling setState on components
// that has been subscribed by using useStore()

/*

How it works:

- Context is created for the store by using useCreateStore()
- The context is returned and is used as reference in useStore()
  and should be stored in a variable
- Contexts can be used outside the rendering tree, so the best
  way to handle data is to put them in a file that can be imported
  by components using the srtore
- Each component calls useStore() to get the data and the dispatch
  function. The dispatch function is used to update the store data.
- useStore() uses useContext() to get a reference to the store
  and it uses useState() to set the variables locally, and
  useEffect() to subscribe to the store data changes, and
  gives a callback to unsubscribe when the component is unmounted.

 
*/

//
// Hook for using the store
//

let storeCounter = 0;

function createStore<Data>(id: string, defaultDdata: Data, createController? : StoreCreateController<Data>): Store<Data> {

    let context: React.Context<Store<Data>>;

    function create(): Store<Data> {
        console.log("useCreateStore() creating store: ", id, "create count: ", storeCounter++);
        const thisStore = id;

        let data_ = defaultDdata;

        const eventHandler = createEventHandler<Data>();

        function dispatch(action: (StoreAction<Data> | ((data: Data) => StoreAction<Data>))) {

            // If the parameter is a function, call the function with the current store data
            // and then we call ourself again with the StoreAction that the function returns.
            if (typeof action === "function") {
                // console.log("useStore dispatch() function: ");
                const cb = action as (store: Data) => StoreAction<Data>;
                const a = cb(data_)
                dispatch(a);
                return;
            }

            switch (action.type) {
                case "set":
                    let payload = action.payload;
                    store.data = data_ = { ...data_, ...payload };
                    eventHandler.notify(data_);
                    break;
                case "field":
                    // TODO: This code is messy now, testing the functionality. CLEAN IT UP!!
                    const field = action.payload as PayloadSetField;
                    const key: string = String(field.key);
                    const value = field.value;
                    const keys: string[] = key.split(".");
                    if (keys.length == 1) {
                        store.data = data_ = { ...data_, [key]: value };
                        eventHandler.notify(data_);
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
                            destinationRoot = data_;
                        } else {
                            destinationRoot = getObjectByKey(data_, path);
                        }

                        // If key has a $ prefix, we look for an object with id equal to the value
                        // and replace the destinationKey with the actual key of that object                        
                        if (destinationKey.startsWith("$")) {
                            const id = destinationKey.substring(1);
                            for(let key in destinationRoot) {
                                if (destinationRoot[key].id === id) {
                                    destinationKey = key;
                                    break;
                                }
                            }
                        }

                        // Now we are ready to update the object.
                        // If the destinationRoot is an array, we use the index as key
                        let index;
                        if(Array.isArray(destinationRoot)) {
                            index = parseInt(destinationKey);
                        } else {
                            index = destinationKey;
                        }

                        // Update the object
                        destinationRoot[index] = { ...destinationRoot[index], [fieldName]: value };

                        // Notify the subscribers
                        eventHandler.notify(data_);
                    }
                    break;

                case "nop":
                    break;
                default:
                    throw new Error("Unknown action type: " + action.type);
            }
        }


        const useStore:UseStore<Data> = () => {
            // TODO: It might be just as good to access data directly?
            const store = useContext(context);
            let data_ = store.data;

            const [data, setData] = useState<Data>(defaultDdata);

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


            return { data, dispatch, controller };
        }
        const useData: UseData = (key: string) => {

            const [data, setData] = useState<any>(getObjectByKey(defaultDdata, key));

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

            function set(data: any) {
                throw new Error("Not implemented");
            }
            return { data, set, controller };
        }

        const useController = () => {
            return controller;
        }

        const useDispatch = () => {
            return dispatch;
        }

        const st: Store<Data> = { useStore, useData, dispatch, data: data_, id: thisStore, controller, useController, useDispatch };

        var controller = createController ? createController(st, dispatch) : undefined

        return st;
    }


    const store = create();

    // We create a context so that we can get back the store in useStore()
    context = createContext<Store<Data>>(store);

    console.log("%% useCreateStore() returning store: ", id);
    return store;
}

// This is a helper function to do a deep lookup in an object.
// A text identifies a key name, a number identifies a key name org index in an array,
// a $ prefix will look for an object where the field "id" is equal to the value.
// The key is formatted like this: "a.1.$c" and the function will
// return an objct with id="c" in the array at index 1 in the object "a".

function getObjectByKey(obj: any | any[], key: any | [] | string | undefined) {

    // console.log("getObjectByKey() called with key: ", key);

    if (!key) return obj;
    if (!obj) return undefined;

    let keys: any[];
    if (Array.isArray(key)) {
        keys = key;
    } else if (typeof key === "string") {
        keys = key.split(".");
    } else {
        keys = [key];
    }
    let depth = 0;

    return lookup(obj, keys);



}

function lookup(obj: any, keys: any[]): any {


    let k = keys[0];

    if (k === undefined || k.length === 0) {
        // console.log("In level: ", depth, " returning object: ", obj);
        return obj;
    }

    if (!obj) {
        return undefined;
    }

    // console.log("Looking for key: ", k, " at depth: ", depth++ , " witg parsedKey: ", keys);

    let foundObj = undefined;

    if (k.startsWith("$")) {
        // console.log("Looking for ID: ", k);
        let id = k.substring(1);
        if (Array.isArray(obj)) {
            foundObj = obj.find((o: any) => o.id === id);
        } else if (typeof obj === "object") {
            // Object doesent have find, but we still have to search through to find a child object where id is equal to the key
            for (let key in obj) {
                let child = obj[key];
                if (typeof child === "object") {
                    if (child.id === id) {
                        foundObj = obj[key];
                        break;
                    }
                }
            }
        }

    } else {
        // console.log("Looking for KEY: ", k);
        if (Array.isArray(obj)) {
            let index = parseInt(k);
            foundObj = obj[index];
        } else if (typeof obj === "object") {
            foundObj = obj[k];
        }
    }
    // console.log("..Found object.");
    if (foundObj === undefined) return undefined;
    return lookup(foundObj, keys.slice(1));
}

export default createStore;
export { getObjectByKey, lookup };
