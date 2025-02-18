import React from "react";
import CommunicationPanel from "./CommunicationPanel";
import HistoryPanel from "./HistoryPanel";
import StorePanel from "./StorePanel";

export default function StoreInspector() {


    return (
        <>

            <StorePanel />
            <CommunicationPanel />
            <HistoryPanel />

        </>
    );
}


