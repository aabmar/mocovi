import { EventHandler } from "./EventHandler";
import { createSync } from "./sync";
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
    add: (model: Data) => void;
    set: (model: Data) => void;
    setCollection: (newCollection: Data[]) => void;
    setField: (modelId: string, key: keyof Data, value: any) => void;
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

type Controller<Data, ExtraController> = BaseController<Data> & ExtraController;
type UseController<Data, ExtraController> = () => Controller<Data, ExtraController>;

type CreateController<Data, ExtraController = {}> = (baseController: BaseController<Data>) => ExtraController;

type Store<Data extends Model, ExtraController = {}> = {
    id: string;
    eventHandler: EventHandler<Data[]>;
    selectedEventHandler: EventHandler<string | null>;
    collectionData: Data[];
    baseController: BaseController<Data>;
    mergedController: BaseController<Data> & ExtraController;
    useCollection: UseCollection<Data>;
    useModel: UseModel<Data>;
    useSelected: UseSelected;
    useController: UseController<Data, ExtraController>;
    selectedModelId: string | null;
    persist?: Persist;
    sync?: Sync;
    syncCallback?: (data: Data[]) => void;
    previousData?: Map<string, Model>;

};

const stores = new Map<string, Store<any>>();

type Message = {
    // Object with storename as key, and one array of models for each store
    storeId: string;
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
    sync_ = createSync(url, sessionId);

    console.log("Store: startSync() sync: ", stores);

    // Set sync to stores that have syncCallback
    for (let store of stores.values()) {
        if (store?.syncCallback) {
            store.sync = sync_;
        }
    }
}

export {
    addStore, getStore, clearAll,
    CreateController, BaseController, Store, UseController, Controller,
    Persist, Model, Sync, Message, startSync
};

