

// This is a very simple store for named objects.
// The reason for its existence is to prevent data loss
// while development, since touched files will be reloaded
// in the browser, and the state will be lost.


// This will be expanded in the future to include update and set field
// functions, and that will also handle diffing so that we only
// emit events on actual changes.

type PayloadSetField = {
    key: string;
    value: any;
}

type StoreAction<Data> = {
    type: string;
    payload: Data | PayloadSetField;
}

type Store<Data> = {
    dispatch: (action: (StoreAction<Data> | ((data: Data) => StoreAction<Data>))) => void;
    useStore: () => [data: Data, (action: (StoreAction<Data> | ((data: Data) => StoreAction<Data>))) => void];
    data: Data;
}

type StoreStore = {
    [key: string]: Store<any>
}


const stores: StoreStore = {};

function getStore<Data>(name:string):Store<Data> | null {

    let s: Store<Data> = stores[name];

    console.log("getStore() ", name, s);

    if(!s) {
        return null;
    }

    return s;
}

function setStore<Data>(name:string, store:Store<Data>) {
    stores[name] = store;
}

export  {getStore, setStore, StoreAction, Store, PayloadSetField};
