import React, { useEffect, useContext, useState, createContext } from "react";
import { createEventHandler } from "./Event";
import { PayloadSetField, Store, StoreAction, StoreDispatch, UseData } from "./Store";

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

function createStore<Data>(id: string, defaultDdata: Data) {

    let context: React.Context<Store<Data>>;

    function create(): Store<Data> {
        console.log("useCreateStore() creating store: ", id,  "create count: ", storeCounter++);
        const thisStore = id;

        let data_ = defaultDdata;

        const eventHandler = createEventHandler<Data>();

        function dispatch( action: (StoreAction<Data> | ((data: Data) => StoreAction<Data>)) ) {

            // If the parameter is a function, call the function with the current store data
            // and then we call ourself again with the StoreAction that the function returns.
            if(typeof action === "function") {
                // console.log("useStore dispatch() function: ");
                const cb = action as (store: Data) => StoreAction<Data>;
                const a = cb(data_)
                dispatch(a);
                return;
            }
        
            switch (action.type) {
                case "set":
                    // console.log("useStore dispatch() SET: ", action.payload);
                    let payload = action.payload;
                    store.data = data_ = {...data_, ...payload};
                    eventHandler.notify(data_);
                    break;
                case "field":
                    let field = action.payload as PayloadSetField;
                    store.data = data_ = {...data_, [field.key]: field.value};
                    eventHandler.notify(data_);                
                    break;
                case "nop":
                    break;
                default:
                    throw new Error("Unknown action type: " + action.type);
            }
        }

        function useStore(): {data: Data, dispatch: StoreDispatch<Data>, useData:UseData} {
            // TODO: It might be just as good to access data directly?
            const store = useContext(context);
            let data_ = store.data;
            
            const [data, setData] = useState<Data>(data_);
            
            console.log("useStore() called for store: ", thisStore, " got from context: ", store.id);
            console.log("DATA FROM CONTEXT: ", data_);
            console.log("DATA FROM STATE: ", data);

            useEffect(() => {
                function handleChange(data: Data) {
                    setData(() => data);
                }
                eventHandler.subscribe(handleChange);
                return () => {
                    eventHandler.unsubscribe(handleChange);
                }
            }, []);

            const useData: UseData = (key: string) => {

                const [data, setData] = useState<any>(getObjectByKey(data_, key));

                useEffect(() => {
                    function handleChange(data: Data) {
                        const filtered = getObjectByKey(data, key);
                        setData(() => filtered);
                    }
                    eventHandler.subscribe(handleChange);
                    return () => {
                        eventHandler.unsubscribe(handleChange);
                    }
                }, []);
    
    
                function set(data: any){
                    throw new Error("Not implemented");
                }
                return {data: getObjectByKey(data, key), set};
            }

            return {data, dispatch, useData};
        }


        const st:Store<Data> = {useStore, dispatch, data: data_, id: thisStore};
        return st;
    }

    const store = create();

    // We create a context so that we can get back the store in useStore()
    context = createContext<Store<Data>>(store);
    
    console.log("%% useCreateStore() returning store: ", store);
    return store.useStore;
}

// This is a helper function to do a deep lookup in an object.
// A text identifies a key name, a number identifies a key name org index in an array,
// a $ prefix will look for an object where the field "id" is equal to the value.
// The key is formatted like this: "a.1.$c" and the function will
// return an objct with id="c" in the array at index 1 in the object "a".

function getObjectByKey(obj: any|any[], key: string|undefined) {

    if(!key) return obj;
    if(!obj) return undefined;

    
    let keys = key.split(".");
    
    return lookup(obj, keys);
    
    function lookup(obj: any, parsedKey: string[]): any{

        console.log("Looking for key: ", keys, " in object: ", obj);

        let k = parsedKey.shift();

    
        if(k === undefined || k.length === 0) {
            return obj;
        }
        
        if(!obj) {
            return undefined;
        }
        
        let foundObj = undefined;

        if(k.startsWith("$")) {
            console.log("Looking for ID: ", k);
            let id = k.substring(1);
            if(Array.isArray(obj)) {
                foundObj = obj.find((o: any) => o.id === id);
            } else if(typeof obj === "object") {
                // Object doesent have find, but we still have to search through to find a child object where id is equal to the key
                for(let key in obj) {
                    let child = obj[key];
                    if(typeof child === "object") {
                        if(child.id === id) {
                            foundObj = obj[key];
                            break;
                        }
                    }
                }
            }

        } else {
            console.log("Looking for KEY: ", k);
            if(Array.isArray(obj)) {
                let index = parseInt(k);
                foundObj = obj[index];
            } else if(typeof obj === "object") {
                foundObj = obj[k];
            }
        }
        if(foundObj === undefined) return undefined;
        return lookup(foundObj, parsedKey);
    }

}


export default createStore ;
export { getObjectByKey };
