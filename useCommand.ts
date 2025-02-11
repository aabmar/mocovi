import { Message, Store, Sync } from "./types";



export default function createUseCommand<Data extends { id: string }>(store: Store<Data>) {

    return function useCommand() {

        function send(cmd: string, payload?: any) {
            console.log("useCommand() send(): ", cmd, payload);

            const message: Message = {
                storeId: store.id,
                operation: "cmd",
                cmd,
                sessionId: store.sync?.sessionId || "",
                payload: payload || []
            }
            console.log("useCommand(): ", message.storeId, message.operation, message.cmd, message.payload);
            store.sync?.send(message);
        }

        return send;
    }

}