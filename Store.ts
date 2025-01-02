import { EventHandler } from "./EventHandler";
import { UseCollection, UseCollectionReturn } from "./useCollection";
import { UseModel, UseModelReturn } from "./useModel";
import { UseSelected, UseSelectedReturn } from "./useSelected";

type BaseController<Data> = {
    clear: () => void,
    get: (modelId: string) => Data | null,
    getCollection: () => Data[],
    getField: (modelId: string, key: keyof Data) => any,
    getSelected: () => Data | null,
    getSelectedId(): string | null,
    select: (modelId: string | null) => void,
    set: (model: Data) => void,
    setCollection: (newCollection: Data[]) => void,
    setField: (modelId: string, key: keyof Data, value: any) => void,
};

type Controller<Data, ExtraController> = BaseController<Data> & ExtraController;
type UseController<Data, ExtraController> = () => Controller<Data, ExtraController>;

type CreateController<Data, ExtraController = {}> = (baseController: BaseController<Data>) => ExtraController;

const stores = new Map<string, Store<any>>();

function clearAll() {
    for (let store of stores.values()) {
        store.useController().clear();
    }
}

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
};

export { stores, clearAll, CreateController, BaseController, Store, UseController, Controller };
