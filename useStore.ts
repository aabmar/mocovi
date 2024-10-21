import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
// import { Store, StoreAction, storeContext } from "./StoreContext";
import { createEventHandler } from "./Event";
import { getStore, PayloadSetField, setStore, Store, StoreAction } from "./Store";


//
// Hook for using the store
//

function useStore<Data>(name:string): [Data, (action: (StoreAction<Data> | ((data: Data) => StoreAction<Data>))) => void] {
    
    const store = getStore<Data>(name);
    
    if(!store) {
        throw new Error("Store not found: " + name);
    }
    return store.useStore();
}

// function getDispatch(name:string): (action: (StoreAction<any> | ((data: any) => StoreAction<any>))) => void {
//     const store = getStore(name);
    
//     if(!store) {
//         throw new Error("Store not found: " + name);
//     }
//     return store.dispatch;
// }

// export default useStore;
export default useStore;
