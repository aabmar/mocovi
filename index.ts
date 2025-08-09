// Map all exports

import createStore from "./createStore";
import { clearAll } from "./Store";
import { diff } from "./util";
import useHistory from "./useHistory";
import logger, { setLog } from "./logger";
import useStore from "./useStore";
import useController from "./useController";

import {
    Store, Sync, Persist,
    CreateCollectionOptions, CreateController,
    UseController, UseCollection, UseModel, UseSelected,
    Message, Model, BaseController,
    UseSelectedReturn, UseCollectionReturn, UseModelReturn,
    SyncModes, MessageTypes,
} from "./types";

export {
    createStore, CreateController, BaseController, Model, Persist, clearAll, diff, Store, Sync,
    CreateCollectionOptions, UseController, UseCollection, UseModel, UseSelected, Message,
    UseSelectedReturn, UseCollectionReturn, UseModelReturn, useHistory, logger, setLog,
    SyncModes, MessageTypes, useStore, useController
};
