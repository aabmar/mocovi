import { useEffect } from "react";
import { Message, MessageTypes, Store } from "../lib/types";
import { nanoid } from "../lib/nanoid";
import logger from "../lib/logger";

const { log, err, dbg } = logger("useCom");


export default function createUseCom<Data extends { id: string }>(store: Store<Data>) {

    return function useCom(callback?: (message: Message) => void,) {

        const id = nanoid();

        function send(cmd: string, payload?: any, operation: MessageTypes = "cmd") {
            log("useCommand() send(): ", cmd, payload);

            if (store.syncAdapter?.sendCommand) {
                // Use new adapter's sendCommand if available
                store.syncAdapter.sendCommand(store.id, cmd, payload);
            } else if (store.sync) {
                // Legacy WebSocket sync
                const message: Message = {
                    storeId: store.id,
                    operation,
                    cmd,
                    payload: payload || []
                }
                dbg("useCommand(): ", message);
                store.sync?.send(message);
            } else {
                err("No sync adapter or sync object available");
            }
        }

        useEffect(() => {

            if (!callback) {
                dbg("useCom() useEffect() no callback");
                return
            }

            setTimeout(() => {
                if (!store.syncAdapter && !store.sync) {
                    dbg("useCom() useEffect() no sync adapter or sync");
                    return
                }

                dbg("useCom() useEffect() subscribing to store: ", store.id);
                store.subscribe(store.id, callback);
            }, 500);

            return () => {
                store.unsubscribe(store.id, callback);
            };
        }, []); // No dependencies, only run once and clean up

        return { send };
    }

}