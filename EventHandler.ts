

export type EventHandler<Data> = {
    subscribe: (callback: (data: Data) => void) => void,
    notify: (data: Data) => void,
    unsubscribe: (callback: (data: Data) => void) => void
};

export function createEventHandler<Data>(): EventHandler<Data> {

    let subscribers: Array<Function> = [];

    // let [ subscribers, setSubscribers] = useState<Array<Function>>([]);

    function setSubscribers(callback: (subscribers: Array<Function>) => Array<Function>) {
        subscribers = callback(subscribers);
    }

    function subscribe(callback: (data: Data) => void) {

        // Add to array if not present already
        subscribers = [...subscribers, callback];

        // setSubscribers((subscribers) => {
        //     if (subscribers.indexOf(callback) > -1) return subscribers
        //     const s = [...subscribers, callback];
        //     // console.log("EventHandler subscribe() ", s.length);
        //     return s;
        // });
    }

    function notify(data: Data) {
        // console.log("EventHandler notify() ", subscribers.length, data);
        // setSubscribers((subscribers) => {
        for (let i = 0; i < subscribers.length; i++) {
            subscribers[i](data);
        }
        //     return subscribers;
        // });
    }

    function unsubscribe(callback: (data: Data) => void) {
        // setSubscribers((subscribers) => {
        subscribers = subscribers.filter((subscriber) => subscriber !== callback);
        // console.log("EventHandler unsubscribe() ", s.length);
        //     return s;
        // });
    }

    return { subscribe, notify, unsubscribe };
}
