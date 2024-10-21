import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
// import { Store, StoreAction, storeContext } from "./StoreContext";
import { createEventHandler } from "./Event";
import { getStore, PayloadSetField, setStore, Store, StoreAction } from "./Store";


//
// Hook for using the store
//


function useCreateStore<Data>(name:string, data: Data) {
    
    if(getStore(name)) {
        console.log("useCreateStore() store already exists: ", name);
        // return;
    }

    // let store = data;
    const storeRef = useRef<Data>(data);

    const eventHandlerRef = useRef(createEventHandler<Data>());
    const eventHandler = eventHandlerRef.current;

    // useEffect(() => {
    //     eventHandler.notify(storeRef.current);
    // }, [store]);

    function dispatch( action: (StoreAction<Data> | ((data: Data) => StoreAction<Data>)) ) {

        // If the parameter is a function, call the function with the current store data
        // and then we call ourself again with the StoreAction that the function returns.
        if(typeof action === "function") {
            console.log("useStore dispatch() function: ");
            const cb = action as (store: Data) => StoreAction<Data>;
            const a = cb(storeRef.current)
            dispatch(a);
            return;
        }
    
        switch (action.type) {
            case "set":
                console.log("useStore dispatch() SET: ", action.payload);
                let payload = action.payload;
                storeRef.current = {...storeRef.current, ...payload};
                eventHandler.notify(storeRef.current);
                break;
            case "field":
                let field = action.payload as PayloadSetField;
                storeRef.current = {...storeRef.current, [field.key]: field.value};
                eventHandler.notify(storeRef.current);                
                break;
            case "nop":
                break;
            default:
                throw new Error("Unknown action type: " + action.type);
        }
    }

    function useStore(): [data: Data, (action: (StoreAction<Data> | ((data: Data) => StoreAction<Data>))) => void] {

        const [data, setData] = useState<Data>(storeRef.current);

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
    setStore(name, st);    
}

export default useCreateStore ;
