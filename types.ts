
type EventHandler<Data> = {
    subscribe: (callback: (data: Data) => void) => void,
    notify: (data: Data) => void,
    unsubscribe: (callback: (data: Data) => void) => void
};

type BaseController<Data> = {
    clear: () => void;
    get: (modelId: string | undefined) => Data | null;
    getCollection: () => Data[];
    getInternalStorage(): Map<string, Data>;
    getField: (modelId: string, key: keyof Data) => any;
    getSelected: () => Data | null;
    getSelectedId(): string | null;
    select: (modelId: string | null | true) => null | Data;
    set: (model: Data, select?: "no" | "if_empty" | "yes", markChanged?: boolean) => void;
    setCollection: (newCollection: Data[], source?: "persist" | "sync" | false) => void;
    setField: (modelId: string, key: keyof Data, value: any, markChanged?: boolean) => void;
    fetch(id?: string | string[]): void;
    delete: (modelId: string) => void;
    __getAndResetChanges: () => ChangeEntry;
    size: () => number;
    getFirst: () => Data | null;
    getLast: () => Data | null;
    getNewest: () => Data | null;
    getOldest: () => Data | null;
    has: (modelId: string) => boolean;
    subscribe: (callback: (data: Data[]) => void) => (data: Data[]) => void;
    unsubscribe: (callback: (data: Data[]) => void) => void;
};

type Persist = {
    set: (key: string, value: string) => void;
    get: (key: string) => string | undefined;
    name?: string;
};

type Sync = {
    send: (msg: Message) => boolean;
    sendChanges: (store: Store<any>, changes: ChangeEntry) => boolean;
    close: () => void;
    attach: (store: Store<any>) => void;
    subscribe: (topic: string, callback: (msg: Message) => void) => void;
    unsubscribe: (topic: string, callback: (msg: Message) => void) => void;
}

type Model = {
    id: string;
    created_at?: number; //  Set on server
    updated_at?: number; // Set on server
    synced_at?: number; // set on client
    deleted_at?: number; // set on client
    changed_at?: number; // set on client

}

type SyncModes = "auto" | "set" | "get" | "manual" | false;

type CreateCollectionOptions<Data, ExtraController = {}> = {
    createController?: CreateController<Data, ExtraController>
    persist?: Persist,
    sync?: SyncModes,
    autoSelect?: boolean,
    useHistory?: boolean,
};

type Controller<Data, ExtraController> = BaseController<Data> & ExtraController;
type UseController<Data, ExtraController> = () => Controller<Data, ExtraController>;
type CreateController<Data, ExtraController = {}> = (baseController: BaseController<Data>) => ExtraController;


type Store<Data extends Model, ExtraController = {}> = {
    id: string;
    eventHandler: EventHandler<Data[]>;
    // collectionData2: Map<string, Data>;
    baseController: BaseController<Data>;
    mergedController: BaseController<Data> & ExtraController;
    useCollection: UseCollection<Data>;
    useModel: UseModel<Data>;
    useSelected: UseSelected<Data>;
    useController: UseController<Data, ExtraController>;
    useCom: UseCom;
    selectedModelId: string | null;
    persist?: Persist;
    syncMode: SyncModes;
    sync?: Sync;
    syncCallback?: (changes: { inserted: Model[]; updated: Model[]; deleted: Model[]; previous: Model[]; }) => void;
    initialData?: Data[];
    autoSelect?: boolean;
    history?: boolean;
    subscribesTo: Map<(msg: Message) => void, string>;
    subscribe: (topic: string, callback: (msg: Message) => void) => void;
    unsubscribe: (topic: string, callback: (msg: Message) => void) => void;
    resubscribe: () => void;
};

type MessageTypes = "get" | "set" | "cmd" | "response" | "update" | "subscribe" | "unsubscribe" | "direct" | "broadcast" | "list" | "delete" | "subscribed";

type Message = {
    // Object with storename as key, and one array of models for each store
    storeId: string; // This is event name on broadcast and user session id on direct
    operation: MessageTypes;
    payload: Model[] | {};
    cmd?: string; // Can be freely used on broadcast and direct
    sessionId?: string; // set this to null, and the system will assign it on sync.send()
}

type UseSelectedReturn<Data> = [Data | null, (model: Data) => void];
type UseSelected<Data> = () => UseSelectedReturn<Data>;
type UseCollectionReturn<Data extends { id: string }> = [Data[], (newCollection: Data[]) => void, string | null];
type UseCollection<Data extends { id: string }> = () => UseCollectionReturn<Data>;
type UseModelReturn<Data extends { id: string }> = [Data | null, (newModel: Data) => void];
type UseModel<Data extends { id: string }> = (modelId: string | undefined) => UseModelReturn<Data>;
type UseCom = (callback?: (message: Message) => void) => { send: (cmd: string, payload?: any, operation?: MessageTypes) => void };



type ChangeLog = ChangeEntry[];

type ChangeEntry = {
    storeId: string;
    inserted: Model[];
    updated: Model[];
    deleted: Model[];
    previous: Model[];
}

export type {
    Store, Sync, Persist,
    EventHandler, CreateCollectionOptions, CreateController,
    UseController, UseCollection, UseModel, UseSelected,
    Message, Model, BaseController,
    UseSelectedReturn, UseCollectionReturn, UseModelReturn,
    UseCom as UseCommand, ChangeEntry, ChangeLog,
    MessageTypes, SyncModes
};
