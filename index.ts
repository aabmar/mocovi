// Map all exports

import createStore from "./createStore";
import { clearAll, getStore, startSync } from "./Store";
import { diff } from "./util";
import useHistory from "./useHistory";
import logger, { setLog } from "./logger";
import useStore from "./useStore";
import useController from "./useController";
import { stopSync } from "./sync";

import {
    Store, Sync, Persist,
    CreateCollectionOptions, CreateController,
    UseController,
    Message, Model, BaseController,
    SyncModes, MessageTypes,
} from "./types";

function mset(store: string, key: string, field: string, value: any) {

    if (!store || !key || !field) {
        console.log("mset(store, key and field, value) are required");
        return;
    }

    const s = getStore(store);
    if (!s) return console.log("store not found: ", store);

    s.baseController.setField(key, field, value);
}

function mget(store: string, key: string) {
    if (!store || !key) {
        console.log("mget(store, key) are required");
        return;
    }

    const s = getStore(store);
    if (!s) return console.log("store not found: ", store);

    return s.baseController.get(key);
}

export {
    createStore, CreateController, BaseController, Model, Persist, clearAll, diff, Store, Sync,
    CreateCollectionOptions, UseController, Message,
    useHistory, logger, setLog, stopSync, startSync,
    SyncModes, MessageTypes, useStore, useController,
    mset, mget
};

