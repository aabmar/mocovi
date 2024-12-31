// This is a very simple store for named objects.
// The reason for its existence is to prevent data loss
// while development, since touched files will be reloaded
// in the browser, and the state will be lost.

import React from "react";
import { EventHandler } from "./Event";

type BaseController<Data> = {
    getCollection: () => Data[],
    get: (modelId: any) => Data | null,
    getField: (modelId: any, key: keyof Data) => any,
    getSelected: () => Data | null,
    setCollection: (newCollection: Data[]) => void,
    set: (model: Data) => void,
    setField: (modelId: any, key: keyof Data, value: any) => void,
    clear: () => void,
    select: (modelId: string) => void,
};

type CreateController<Data, ExtraController = {}> = (baseController: BaseController<Data>) => ExtraController;

export { CreateController, BaseController };

// This will be expanded in the future to include update and set field
// functions, and that will also handle diffing so that we only
// emit events on actual changes.

type PayloadSetField = {
    key: string;
    value: any
}

type PayloadSync = {
    id?: string;
    // TODO: add paramers for fetch here
}


// Remove old dispatch-based types
// type StoreDispatch<Data> = (action: (StoreAction<Data> | ((data: Data) => StoreAction<Data>))) => void

// Remove old UseStore, UseData, UseDispatch, StoreCreateController, etc.
// type UseStore<Data> = () => [Data, StoreDispatch<Data>];
// type UseData = (key: string) => any;
// type UseDispatch<Data> = () => StoreDispatch<Data>;
// type UseController<Controller = null> = () => Controller | null;
// type StoreInternal<Data> = {
//     data: Data,
//     id: string
// }

// type StoreController<Controller = null> = () => Controller;
// type StoreCreateController<Data, Controller = null> = (internal: StoreInternal<Data>, dispatch: StoreDispatch<Data>, eventHandler: EventHandler<Data>) => Controller;

// Remove old Store, StoreAction, etc.


const stores = new Map<string, any>();

function clearAll() {
    for (const [id, store] of stores.entries()) {
        store.useController().clear();
    }
}

export { stores, clearAll };
