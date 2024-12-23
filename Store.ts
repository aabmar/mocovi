

// This is a very simple store for named objects.
// The reason for its existence is to prevent data loss
// while development, since touched files will be reloaded
// in the browser, and the state will be lost.

import React from "react";
import { EventHandler } from "./Event";


// This will be expanded in the future to include update and set field
// functions, and that will also handle diffing so that we only
// emit events on actual changes.

type PayloadSetField = {
    key: string;
    value: any;
}

type PayloadSync = {
    id?: string;
    // TODO: add paramers for fetch here
}

type StoreAction<Data> = {
    type: string;
    payload: Data | PayloadSetField | PayloadSync;
}

type StoreDispatch<Data> = (action: (StoreAction<Data> | ((data: Data) => StoreAction<Data>))) => void

type UseStore<Data> = () => [Data, StoreDispatch<Data>];
type UseData = (key: string) => any;
type UseDispatch<Data> = () => StoreDispatch<Data>;
type UseController<Controller = null> = () => Controller | null;
type StoreInternal<Data> = {
    data: Data,
    id: string
}

// type StoreController<Controller = null> = () => Controller;
type StoreCreateController<Data, Controller = null> = (internal: StoreInternal<Data>, dispatch: StoreDispatch<Data>, eventHandler: EventHandler<Data>) => Controller;

type Store<Data, Controller = null> = {
    dispatch: StoreDispatch<Data>;
    useStore: UseStore<Data>;
    useData: UseData;
    useController: UseController<Controller>;
    useDispatch: UseDispatch<Data>;
    controller?: Controller;
}

type StoreOptions<Data, Controller> = {
    createController?: StoreCreateController<Data, Controller>;
    apiUrl?: string;
    localStoreName?: string;
    disableLocalStore?: boolean;
}

const stores = new Map<string, Store<any, any>>();

function clearAll() {
    for(let name in stores.keys()) {
        const store = stores.get(name);
        if(!store) continue;
        console.log("clearAll() clearing store: ", name);
        store.dispatch({ type: "set", payload: {} });
    }
}

const SessionContext = React.createContext(null);



export { stores, clearAll, SessionContext }
export type {
    StoreAction,
    Store,
    PayloadSetField,
    StoreDispatch, 
    UseStore, 
    UseData, 
    StoreCreateController, 
    UseController, 
    UseDispatch, 
    StoreInternal, 
    PayloadSync, 
    StoreOptions,
    
};
