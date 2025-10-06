import { EventHandler } from "./types";

export function createEventHandler<Data>(): EventHandler<Data> {

    let subscribers: Array<Function> = [];

    function subscribe(callback: (data: Data) => void) {

        // Add to array if not present already
        subscribers = [...subscribers, callback];
    }

    function notify(data: Data) {
        // console.log("EventHandler notify() ", subscribers.length, data);
        for (let i = 0; i < subscribers.length; i++) {
            subscribers[i](data);
        }
    }

    function unsubscribe(callback: (data: Data) => void) {
        // setSubscribers((subscribers) => {
        subscribers = subscribers.filter((subscriber) => subscriber !== callback);

    }

    return { subscribe, notify, unsubscribe };
}
