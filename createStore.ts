import React, { useEffect, useRef, useState, createContext } from "react";
import { createEventHandler } from "./Event";
import { getStore, PayloadSetField, setStore, Store, StoreAction } from "./Store";

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


function createStore<Data>(defaultDdata: Data) {
    
    function create(): Store<Data> {
        console.log("useCreateStore() creating store");

        let data_ = defaultDdata;

        const eventHandlerRef = useRef(createEventHandler<Data>());
        const eventHandler = eventHandlerRef.current;


        function dispatch( action: (StoreAction<Data> | ((data: Data) => StoreAction<Data>)) ) {

            // If the parameter is a function, call the function with the current store data
            // and then we call ourself again with the StoreAction that the function returns.
            if(typeof action === "function") {
                console.log("useStore dispatch() function: ");
                const cb = action as (store: Data) => StoreAction<Data>;
                const a = cb(data_)
                dispatch(a);
                return;
            }
        
            switch (action.type) {
                case "set":
                    console.log("useStore dispatch() SET: ", action.payload);
                    let payload = action.payload;
                    data_ = {...data_, ...payload};
                    eventHandler.notify(data_);
                    break;
                case "field":
                    let field = action.payload as PayloadSetField;
                    data_ = {...data_, [field.key]: field.value};
                    eventHandler.notify(data_);                
                    break;
                case "nop":
                    break;
                default:
                    throw new Error("Unknown action type: " + action.type);
            }
        }

        function useStore(): [data: Data, (action: (StoreAction<Data> | ((data: Data) => StoreAction<Data>))) => void] {

            const [data, setData] = useState<Data>(data_);

            useEffect(() => {
                function handleChange(data: Data) {
                    setData(() => data);
                }
                eventHandler.subscribe(handleChange);
                return () => {
                    eventHandler.unsubscribe(handleChange);
                }
            }, [data]);

            return [data, dispatch];
        }

        const st:Store<Data> = {useStore, dispatch};
        return st;
    }

    const store = create();

    // We create a context so that we can get back the store in useStore()
    const context = createContext<Store<Data>>(store);
    
    return context;  
}

export default createStore ;
