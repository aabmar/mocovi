import { useEffect } from "react";
import { Message, MessageTypes, Store } from "./types";
import { nanoid } from "nanoid";



export default function createUseCom<Data extends { id: string }>(store: Store<Data>) {

    return function useCom(callback?: (message: Message) => void,) {

        const id = nanoid();

        function send(cmd: string, payload?: any, operation: MessageTypes = "cmd") {
            console.log("useCommand() send(): ", cmd, payload);

            const message: Message = {
                storeId: store.id,
                operation,
                cmd,
                payload: payload || []
            }
            console.log("useCommand(): ", message);
            store.sync?.send(message);
        }

        useEffect(() => {

            if (!callback) {
                console.log("useCom() useEffect() no callback");
                return
            }

            setTimeout(() => {
                if (!store.sync) {
                    console.log("useCom() useEffect() no sync");
                    return
                }

                console.log("useCom() useEffect() subscribing to store: ", store.id);
                store.subscribe(store.id, callback);
            }, 500);

            return () => {
                store.unsubscribe(store.id, callback);
            };
        }, []); // No dependencies, only run once and clean up

        return { send };
    }

}