
/**
 * Use this hook to start syncing to a store.
 * 
 * Because you need to be logged in to the server and have a session id, this hook should be used in your
 * context or layour or any component that is inside the logged in part of your app.
 * 
 * You need to give the hook the current sessionId and the endpoint to connect to.
*/

import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Sync } from "./types";
import sync from "./sync";
import MocoviContext from "./MocoviContext";
import logger from "./logger";

const { log, err, dbg, level } = logger("useSync");


export default function useSync(sessionId: string | null, endpoint: string, notAuthorizedCallback?: () => void) {

    const syncRef = useRef<Sync | null>(null);
    const mocovi = useContext(MocoviContext);

    // Connect to the server and store the sync object in a ref
    const connect = useCallback(() => {

        if (syncRef.current !== null) {
            err("useSync: already connected");
            return;
        }

        function onClose() {
            log("onClose() called. Reconnecting in 5 seconds...");
            syncRef.current = null;
            setTimeout(() => {
                connect();
            }, 5000);
        }

        function connect() {
            if (!sessionId || !endpoint || !mocovi) {
                err("useSync: No sessionId, endpoint or mocovi context");
                return;
            }
            log("connect() to ", endpoint, " with sessionId ", sessionId);
            syncRef.current = sync(endpoint, sessionId, mocovi?.getStore, mocovi?.getStores, notAuthorizedCallback, onClose);
        }

        connect();

    }, [sessionId, endpoint, mocovi]);


    // Connect when the sessionId or endpoint changes.
    // It returns a cleanup function that closes the connection.
    useEffect(() => {
        log("useEffect() sessionId or endpoint changed. sessionId:", sessionId, "endpoint:", endpoint);

        if (sessionId && endpoint && mocovi) {
            connect();
            return () => {
                log("useEffect() cleanup. Closing sync connection.");
                if (syncRef.current) {
                    syncRef.current.close();
                    syncRef.current = null;
                }
            }

        }

    }, [sessionId, endpoint, syncRef, connect, mocovi]);

}

