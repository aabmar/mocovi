import { useEffect, useState } from "react";
import { ChangeLog } from "../lib/types";
import { eventHandler } from "../lib/history";


export default function useHistory() {
    const [history, setHistory] = useState<ChangeLog>([]);

    useEffect(() => {
        const handleChange = (d: ChangeLog) => {
            if (history === d) return;
            setHistory([...d]);
            // console.log("&& History changed: ", d);
        }
        eventHandler.subscribe(handleChange);
        return () => eventHandler.unsubscribe(handleChange);
    }, []);

    return history;
}


