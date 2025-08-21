// Map all exports

import createStore from "./createStore";
import { clearAll } from "./Store";
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

export {
    createStore, CreateController, BaseController, Model, Persist, clearAll, diff, Store, Sync,
    CreateCollectionOptions, UseController, Message,
    useHistory, logger, setLog, stopSync,
    SyncModes, MessageTypes, useStore, useController
};
