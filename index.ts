// Map all exports

import { diff } from "./util";
import useHistory from "./useHistory";
import logger, { setLog } from "./logger";
import useStore from "./useStore";
import useController from "./useController";
import MocoviContext, { MocoviProvider, MocoviProviderProps } from "./MocoviContext";
import useSync from "./useSync";

import {
    Store, Sync, Persist,
    StoreOptions, CreateController,
    UseController,
    Message, Model, BaseController,
    SyncModes, MessageTypes, MocoviContextContentType,
    MocoviStoreDescriptor
} from "./types";

// function mset(store: string, key: string, field: string, value: any) {

//     if (!store || !key || !field) {
//         console.log("mset(store, key and field, value) are required");
//         return;
//     }

//     const s = getStore(store);
//     if (!s) return console.log("store not found: ", store);

//     s.baseController.setField(key, field, value);
// }

// function mget(store: string, key: string) {
//     if (!store || !key) {
//         console.log("mget(store, key) are required");
//         return;
//     }

//     const s = getStore(store);
//     if (!s) return console.log("store not found: ", store);

//     return s.baseController.get(key);
// }

export type {
    Store, Sync, Persist,
    StoreOptions, CreateController,
    UseController,
    Message, Model, BaseController,
    SyncModes, MessageTypes,
    MocoviContextContentType, MocoviStoreDescriptor, MocoviProviderProps

}

export {
    diff, useHistory, logger, setLog, useStore, useController, MocoviContext, useSync, MocoviProvider
};

