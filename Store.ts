import { EventHandler } from "./EventHandler";
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
    set: (model: Data) => void;
    setCollection: (newCollection: Data[]) => void;
    setField: (modelId: string, key: keyof Data, value: any) => void;
};

type Persist = {
    set: (key: string, value: string) => void;
    get: (key: string) => string | undefined;
    name?: string;
};


type Controller<Data, ExtraController> = BaseController<Data> & ExtraController;
type UseController<Data, ExtraController> = () => Controller<Data, ExtraController>;

type CreateController<Data, ExtraController = {}> = (baseController: BaseController<Data>) => ExtraController;

type Store<Data extends { id: string }, ExtraController = {}> = {
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
    sync?: true | string;
    syncCallback?: (data: Data[]) => void;
};
const stores = new Map<string, Store<any>>();
let syncActive = false;
let previousData = new Map<string, any[]>();

function sync(cid: string, data: any[]) {
    console.log("sync() ", cid, data);
    if (!syncActive) return;

}

function addStore(store: Store<any>) {
    stores.set(store.id, store);

    // If the store has sync enabled, add a callback function
    if (store.sync) {
        function callback(data: any) {
            sync(store.id, data);
        }
        store.syncCallback = callback;
    }
}

function getStore(id: string) {
    return stores.get(id);
}

function clearAll() {
    for (let store of stores.values()) {
        store.useController().clear();
    }
}



export { addStore, getStore, clearAll, CreateController, BaseController, Store, UseController, Controller, Persist };

