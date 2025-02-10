import { Message, Store, Sync } from "./types";



export default function createUseCommand<Data extends { id: string }>(store: Store<Data>) {

    return function useCommand() {
        console.log("Command executed");

        function send(message: Message) {
            console.log("useCommand(): ", message.storeId, message.operation, message.cmd);
            store.sync?.send(message);
        }
    }

}