// Map all exports

import createCollection from "./createCollection";
import { clearAll } from "./Store";
import { diff } from "./util";
import StoreInspector from "./StoreInspector";
import useHistory from "./useHistory";
import logger, { setLog } from "./logger";
import {
    Collection, Sync, Persist,
    CreateCollectionOptions, UseController,
    UseCollection, UseModel, UseSelected,
    Message, Model, BaseController,
    UseSelectedReturn, UseCollectionReturn, UseModelReturn,
    SyncModes, MessageTypes
} from "./types";
import Mocovi from "./Mocovi";

export {
    createCollection, BaseController, Model, Persist, clearAll, diff as printDiff, Collection, Sync,
    CreateCollectionOptions, UseController, UseCollection, UseModel, UseSelected, Message,
    UseSelectedReturn, UseCollectionReturn, UseModelReturn, StoreInspector, useHistory, logger, setLog,
    SyncModes, MessageTypes, Mocovi
};
