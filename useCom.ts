import { useEffect } from "react";
import { Message, MessageTypes, Store } from "./types";



export default function createUseCom<Data extends { id: string }>(store: Store<Data>) {

    return function useCom(callback?: (message: Message) => void,) {

        function send(cmd: string, payload?: any, operation: MessageTypes = "cmd") {
            console.log("useCommand() send(): ", cmd, payload);

            const message: Message = {
                storeId: store.id,
                operation,
                cmd,
                payload: payload || []
            }
            console.log("useCommand(): ", message.storeId, message.operation, message.cmd, message.payload);
            store.sync?.send(message);
        }

        useEffect(() => {

            if (!callback) {
                console.log("useCom() useEffect() no callback");
                return
            }

            if (!store.sync) {
                console.log("useCom() useEffect() no sync");
                return
            }

            console.log("useCom() useEffect() subscribing to store: ", store.id);
            store.subscribe(store.id, callback);

            return () => {
                store.unsubscribe(store.id, callback);
            };
        }, []); // No dependencies, only run once and clean up

        return { send };
    }

}