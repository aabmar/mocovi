


// History is a complete snapshot of the collectionData of all stores at a certain point in time.
// TODO: Not in use now. Reimplement.

import { useEffect, useState } from "react";
import { createEventHandler } from "./EventHandler";
import { ChangeEntry, ChangeLog, Model, Store } from "./types";


const stores = new Map<string, Store<any>>();
const initialData = new Map<string, Model[]>();
const changeLog: ChangeLog = [];
const eventHandler = createEventHandler<ChangeLog>();

function addStoreToHistory(store: Store<any>) {
    stores.set(store.id, store);
    const json = JSON.stringify(store.baseController.getCollection());
    const data = JSON.parse(json);
    initialData.set(store.id, data);

}

function addEntryToHistory(entry: ChangeEntry) {
    changeLog.push(entry);
    eventHandler.notify(changeLog);
}

// Go back in history.
// TODO: If we want redo, we instead move a pointer, and if a new setMark() happens, we remove all entries after the pointer.
function undo() {

}

function useHistory() {
    const [history, setHistory] = useState<ChangeLog>(changeLog);

    useEffect(() => {
        const handleChange = (d: ChangeLog) => {
            if (history === d) return;
            setHistory(d);
        }
        eventHandler.subscribe(handleChange);
        return () => eventHandler.unsubscribe(handleChange);
    }, []);

    return history;
}

export { addEntryToHistory, addStoreToHistory, undo, useHistory };

