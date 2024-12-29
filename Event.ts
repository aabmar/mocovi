


export type EventHandler<D> = {
    subscribe: (callback: (data: D) => void) => void,
    notify: (data: D) => void,
    unsubscribe: (callback: (data: D) => void) => void
};


export function createEventHandler<D>(): EventHandler<D> {
    
    let subscribers: Array<Function> = [];
    
    // let [ subscribers, setSubscribers] = useState<Array<Function>>([]);

    function setSubscribers(callback: (subscribers: Array<Function>) => Array<Function>) {
        subscribers = callback(subscribers);
    }

    function subscribe(callback: (data: D) => void) {

        // Add to array if not present already
        setSubscribers((subscribers) => {
            if(subscribers.indexOf(callback) > -1) return subscribers
            const s = [...subscribers, callback]; 
            // console.log("EventHandler subscribe() ", s.length);
            return s;
        });
    }

    function notify(data: D) {
        // console.log("EventHandler notify() ", subscribers.length, data);
        setSubscribers((subscribers) => {
            for (let i = 0; i < subscribers.length; i++) {
                subscribers[i](data);
            }
            return subscribers;
        });
    }

    function unsubscribe(callback: (data: D) => void) {
        setSubscribers((subscribers) => {
            const s = subscribers.filter((subscriber) => subscriber !== callback); 
            // console.log("EventHandler unsubscribe() ", s.length);
            return s;
        });
    }

    return { subscribe, notify, unsubscribe };
}
