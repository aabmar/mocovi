import { useEffect } from "react";
import { Message, MessageTypes, Collection } from "./types";
import { nanoid } from "./nanoid";
import logger from "./logger";

const { log, err, dbg } = logger("useCom");


export default function createUseCom<Data extends { id: string }>(store: Collection<Data>) {

    return function useCom(callback?: (message: Message) => void,) {

        const id = nanoid();

        function send(cmd: string, payload?: any, operation: MessageTypes = "cmd") {
            log("useCommand() send(): ", cmd, payload);

            const message: Message = {
                storeId: store.id,
                operation,
                cmd,
                payload: payload || []
            }
            dbg("useCommand(): ", message);
            store.sync?.send(message);
        }

        useEffect(() => {

            if (!callback) {
                dbg("useCom() useEffect() no callback");
                return
            }

            setTimeout(() => {
                if (!store.sync) {
                    dbg("useCom() useEffect() no sync");
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