import { useEffect } from "react";
import { Message, Store, Sync } from "./types";



export default function createUseCom<Data extends { id: string }>(store: Store<Data>) {

    return function useCom(callback?: (message: Message) => void,) {

        function send(cmd: string, payload?: any) {
            console.log("useCommand() send(): ", cmd, payload);

            const message: Message = {
                storeId: store.id,
                operation: "cmd",
                cmd,
                payload: payload || []
            }
            console.log("useCommand(): ", message.storeId, message.operation, message.cmd, message.payload);
            store.sync?.send(message);
        }

        useEffect(() => {
            store.sync.subscribe(store.id, callback);

            return () => {
                store.sync.unsubscribe(store.id, callback);
            };
        }, []);

        return { send };
    }

}