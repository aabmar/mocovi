
import React from "react";
import { EventHandler } from "./Event";

type BaseController<Data> = {
    getCollection: () => Data[],
    get: (modelId: any) => Data | null,
    getField: (modelId: any, key: keyof Data) => any,
    getSelected: () => Data | null,
    getSelectedId(): string | null,
    setCollection: (newCollection: Data[]) => void,
    set: (model: Data) => void,
    setField: (modelId: any, key: keyof Data, value: any) => void,
    clear: () => void,
    select: (modelId: string | null) => void,
};

type CreateController<Data, ExtraController = {}> = (baseController: BaseController<Data>) => ExtraController;


const stores = new Map<string, any>();

function clearAll() {
    for (const [id, store] of stores.entries()) {
        store.useController().clear();
    }
}

export { stores, clearAll, CreateController, BaseController  };
