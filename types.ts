
type EventHandler<Data> = {
    subscribe: (callback: (data: Data) => void) => void,
    notify: (data: Data) => void,
    unsubscribe: (callback: (data: Data) => void) => void
};

type BaseController<Data> = {
    clear: () => void;
    get: (modelId: string) => Data | null;
    getCollection: () => Data[];
    getField: (modelId: string, key: keyof Data) => any;
    getSelected: () => Data | null;
    getSelectedId(): string | null;
    select: (modelId: string | null) => void;
    add: (model: Data, select?: true | "if_empty" | false, markChanged?: boolean) => void;
    set: (model: Data, markChanged?: boolean) => void;
    setCollection: (newCollection: Data[]) => void;
    setField: (modelId: string, key: keyof Data, value: any, markChanged?: boolean) => void;
    fetch(id?: string | string[]): void;
    delete: (modelId: string) => void;
    // notify: () => void;
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
    attach: (store: Store<any>) => void;
    sessionId: string;
}

type Model = {
    id: string;
    created_at?: number; //  Set on server
    updated_at?: number; // Set on server
    synced_at?: number; // set on client
    deleted_at?: number; // set on client
    changed_at?: number; // set on client

}

type CreateCollectionOptions<Data, ExtraController = {}> = {
    createController?: CreateController<Data, ExtraController>
    persist?: Persist,
    sync?: "auto" | "set" | "get" | "manual",
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
    useCommand: UseCommand;
    selectedModelId: string | null;
    persist?: Persist;
    syncMode: false | "auto" | "set" | "get" | "manual";
    sync?: Sync;
    syncCallback?: (data: Data[]) => void;
    previousData?: Map<string, Model>;
    initialData?: Data[];
    autoSelect?: boolean;
    history?: boolean;

};

type Message = {
    // Object with storename as key, and one array of models for each store
    storeId: string;
    operation: "get" | "set" | "cmd" | "response" | "update" | "subscribe" | "unsubscribe" | "list";
    payload: Model[] | {};
    cmd?: string;
    sessionId: string;
}

type UseSelectedReturn<Data> = [Data | null, (model: Data) => void];
type UseSelected<Data> = () => UseSelectedReturn<Data>;
type UseCollectionReturn<Data extends { id: string }> = [Data[], (newCollection: Data[]) => void, string | null];
type UseCollection<Data extends { id: string }> = () => UseCollectionReturn<Data>;
type UseModelReturn<Data extends { id: string }> = [Data | null, (newModel: Data) => void];
type UseModel<Data extends { id: string }> = (modelId: string | undefined) => UseModelReturn<Data>;
type UseCommand = () => (cmd: string, payload?: any) => void;



type History = HistoryEntry[];

type HistoryEntry = {
    [key: string]: HistoryDiff[];
}

type HistoryDiff = {
    id: string;
    type: "insert" | "delete" | "update";
    from: Model | null;
    change: { [key: string]: any };
    to: Model | null;
}

export type {
    Store, Sync, Persist,
    EventHandler, CreateCollectionOptions, CreateController,
    UseController, UseCollection, UseModel, UseSelected,
    Message, Model, BaseController,
    UseSelectedReturn, UseCollectionReturn, UseModelReturn,
    UseCommand, HistoryEntry, HistoryDiff, History
};
