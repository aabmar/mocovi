import { EventHandler } from "./EventHandler";
import { getSync } from "./sync";
import { UseCollection, UseCollectionReturn } from "./useCollection";
import { UseModel, UseModelReturn } from "./useModel";
import { UseSelected, UseSelectedReturn } from "./useSelected";

type BaseController<Data> = {
    clear: () => void;
    get: (modelId: string) => Data | null;
    getCollection: () => Data[];
    getField: (modelId: string, key: keyof Data) => any;
    getSelected: () => Data | null;
    getSelectedId(): string | null;
    select: (modelId: string | null) => void;
    add: (model: Data, select?: boolean) => void;
    set: (model: Data) => void;
    setCollection: (newCollection: Data[]) => void;
    setField: (modelId: string, key: keyof Data, value: any) => void;
    fetch(): void;
};

type Persist = {
    set: (key: string, value: string) => void;
    get: (key: string) => string | undefined;
    name?: string;
};

type Sync = {
    send: (msg: Message) => boolean;
    close: () => void;
    findChangedData: (storeId: string, data: Model[]) => Model[];
    sessionId: string;
}


type Model = {
    id: string;
    created_at?: Date; //  Set on server
    updated_at?: Date; // Set on server
    synced_at?: Date; // set on client
    deleted_at?: Date; // set on client
    changed_at?: Date; // set on client
}

type CreateCollectionOptions<Data, ExtraController = {}> = {
    createController?: CreateController<Data, ExtraController>
    persist?: Persist,
    sync?: true | string,
    autoSelect?: boolean,
    useHistory?: boolean,
};

type Controller<Data, ExtraController> = BaseController<Data> & ExtraController;
type UseController<Data, ExtraController> = () => Controller<Data, ExtraController>;

type CreateController<Data, ExtraController = {}> = (baseController: BaseController<Data>) => ExtraController;

type Store<Data extends Model, ExtraController = {}> = {
    id: string;
    eventHandler: EventHandler<Data[]>;
    collectionData: Data[];
    baseController: BaseController<Data>;
    mergedController: BaseController<Data> & ExtraController;
    useCollection: UseCollection<Data>;
    useModel: UseModel<Data>;
    useSelected: UseSelected<Data>;
    useController: UseController<Data, ExtraController>;
    selectedModelId: string | null;
    persist?: Persist;
    sync?: Sync;
    syncCallback?: (data: Data[]) => void;
    previousData?: Map<string, Model>;
    initialData?: Data[];
    autoSelect?: boolean;
    history?: boolean;

};

const stores = new Map<string, Store<any>>();

type Message = {
    // Object with storename as key, and one array of models for each store
    storeId: string;
    operation: "get" | "set" | "cmd";
    models: Model[];
    sessionId: string;
}

function addStore(store: Store<any>) {
    stores.set(store.id, store);

}

function getStore(id: string) {
    return stores.get(id);
}

function clearAll() {
    for (let store of stores.values()) {
        store.useController().clear();
    }

}

let sync_: Sync | undefined;
let sessionId_: string;

function startSync(url: string, sessionId: string) {
    sessionId_ = sessionId;
    console.log("Store: startSync() url: ", url, "sessionId: ", sessionId);
    sync_ = getSync(url, sessionId, stores);
}

// History is a complete snapshot of the collectionData of all stores at a certain point in time.
type HistoryEntry = {
    [key: string]: Model[]
}


const history: HistoryEntry[] = [];
let timeOut: any;

function historyMark() {

    if (timeOut) clearTimeout(timeOut);

    timeOut = setTimeout(() => {
        const entry: HistoryEntry = {};
        for (const store of stores.values()) {
            if (store.history) {
                entry[store.id] = store.collectionData;
            }
        }
        history.push(entry);
        // console.log(" ///////////////////// Store historyMark() ///////////////////\n", entry);
        // if (history.length > 1) {
        //     console.log("Store history diff\n", diff(history[history.length - 1], history[history.length - 2]));
        // }
    }, 100);
}

function undo() {
    if (history.length > 1) {
        const last = history.pop();
        const newState = history[history.length - 1];

        if (!newState) return;
        for (const store of stores.values()) {
            if (store.history) {
                store.collectionData = newState[store.id];
                store.eventHandler.notify(store.collectionData);
            }
        }

        console.log(" ///////////////////// Store undo() ///////////////////\n", diff(last, newState));
    }
}

// Print all values that are different between two objects on the format
// key.key.key: value1 -> value2

function diff(a: any, b: any, path = "") {
    console.log(a === b)
    let diffs = "";
    for (const key in a) {
        // console.log("key: ", key, a[key] !== b[key], a[key], b[key]);
        if (typeof a[key] === "object") {
            diffs += diff(a[key], b[key], path + key + ".");
        } else if (a[key] !== b[key]) {
            diffs += path + key + ": " + a[key] + " -> " + b[key] + "\n";
        }
    }
    return diffs;
}


export {
    addStore, getStore, clearAll,
    CreateController, BaseController, Store, UseController, Controller,
    Persist, Model, Sync, Message, startSync,
    CreateCollectionOptions, historyMark, undo
};

