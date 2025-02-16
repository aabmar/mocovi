


// History is a complete snapshot of the collectionData of all stores at a certain point in time.
// TODO: Not in use now. Reimplement.

import { useEffect, useState } from "react";
import { HistoryDiff, Model, Store } from "./types";
import { diff } from "./util";
import { createEventHandler } from "./EventHandler";


const stores = new Map<string, Store<any>>();

function addStoreToHistory(store: Store<any>) {
    stores.set(store.id, store);
    const json = JSON.stringify(store.baseController.getCollection());
    const data = JSON.parse(json);
    previousData.set(store.id, data);
}

const previousData = new Map<string, Model[]>();
const changeLog: HistoryDiff = [];

let timeOut: any;
let markCounter = 0;


function setMark() {

    // // Create a new entry in the log
    // const entry: HistoryDiff = {};

    // for (const store of stores.values()) {

    //     if (store.history) {
    //         // Map collectionData from array to map

    //         const data = store.collectionData.reduce((acc, item) => {
    //             acc[item.id] = item;
    //             return acc;
    //         }, {} as { [key: string]: Model });

    //         const json = JSON.stringify(data);
    //         entry[store.id] = JSON.parse(json);

    //         // Calculate changes and save to the change log
    //         const lastEntryForStore = previousData.get(store.id) || {};
    //         const changes = [];
    //         diff(store.id, lastEntryForStore, data, changes);
    //         if (changes.length > 0) {
    //             changeLog.push(...changes);
    //             eventHandler.notify(changeLog);
    //         }
    //     }
    // }
    // log.push(entry);

    // console.log("¤¤¤¤¤¤¤¤¤¤¤¤ MARK: ", markCounter++, "\n", entry);

}


// Go back in history.
// TODO: If we want redo, we instead move a pointer, and if a new setMark() happens, we remove all entries after the pointer.
function undo() {
    // if (log.length > 2) {
    //     log.pop();
    //     const last = log.pop();

    //     for (const store of stores.values()) {
    //         if (store.history) {
    //             store.collectionData = last[store.id];
    //             store.eventHandler.notify(store.collectionData);
    //         }
    //     }

    // }
}

type ChangeLog = string[];


const eventHandler = createEventHandler<ChangeLog>();

function useHistory() {
    const [history, setHistory] = useState<string[]>(changeLog);



    useEffect(() => {

        const setter = (data: string[]) => {
            setHistory([...data]);
        }
        eventHandler.subscribe(setter);

        return () => {
            eventHandler.unsubscribe(setter);
        };
    }, []);

    return history;
}

export { addStoreToHistory, historyMark, undo, useHistory };
