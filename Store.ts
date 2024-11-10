

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

type StoreDispatch<Data> = (action: (StoreAction<Data> | ((data: Data) => StoreAction<Data>))) => void

type UseData = (key: string) => {data: any, set: (data: any) => void};

type UseStore<Data> = ()=> {data: Data, dispatch: StoreDispatch<Data>};

type Store<Data> = {
    dispatch: StoreDispatch<Data>;
    useStore: UseStore<Data>;
    useData: UseData
    data: Data;
    id: string;
}

export type {StoreAction, Store, PayloadSetField, StoreDispatch, UseStore, UseData};
