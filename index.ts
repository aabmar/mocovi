// Map all exports

import createCollection from "./createCollection";
import { clearAll } from "./Store";
import { diff } from "./util";
import StoreInspector from "./StoreInspector";
import { useHistory } from "./history";
import useLog, { setLog } from "./useLog";
import {
    Store, Sync, Persist,
    CreateCollectionOptions, CreateController,
    UseController, UseCollection, UseModel, UseSelected,
    Message, Model, BaseController,
    UseSelectedReturn, UseCollectionReturn, UseModelReturn
} from "./types";

export {
    createCollection as createStore, CreateController, BaseController, Model, Persist, clearAll, diff as printDiff, Store, Sync,
    CreateCollectionOptions, UseController, UseCollection, UseModel, UseSelected, Message,
    UseSelectedReturn, UseCollectionReturn, UseModelReturn, StoreInspector, useHistory, useLog, setLog
};
