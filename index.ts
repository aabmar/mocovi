// Map all exports

import { diff } from "./lib/util";
import useHistory from "./hooks/useHistory";
import logger, { setLog, LOG_LEVEL_DEBUG, LOG_LEVEL_ERROR, LOG_LEVEL_INFO, LOG_LEVEL_WARN } from "./lib/logger";
import useStore from "./hooks/useStore";
import useController from "./hooks/useController";
import MocoviContext, { MocoviProvider, MocoviProviderProps } from "./ctx/MocoviContext";
import useSync from "./hooks/useSync";
import { createRESTSyncAdapter, RESTSyncAdapterOptions } from "./lib/adapters/RESTSyncAdapter";
import { createWebSocketSyncAdapter, WebSocketSyncAdapterOptions } from "./lib/adapters/WebSocketSyncAdapter";

import {
    Store, Sync, Persist,
    StoreOptions, CreateController,
    UseController,
    Message, Model, BaseController,
    SyncModes, MessageTypes, MocoviContextContentType,
    MocoviStoreDescriptor, SyncAdapter, SyncAdapterFactory
} from "./lib/types";

export type {
    Store, Sync, Persist,
    StoreOptions, CreateController,
    UseController,
    Message, Model, BaseController,
    SyncModes, MessageTypes,
    MocoviContextContentType, MocoviStoreDescriptor, MocoviProviderProps,
    SyncAdapter, SyncAdapterFactory,
    RESTSyncAdapterOptions, WebSocketSyncAdapterOptions
}

export {
    diff, useHistory, logger, setLog, useStore, useController, MocoviContext, useSync, MocoviProvider,
    LOG_LEVEL_DEBUG, LOG_LEVEL_ERROR, LOG_LEVEL_INFO, LOG_LEVEL_WARN,
    createRESTSyncAdapter, createWebSocketSyncAdapter
};

