import React from "react";
import { Text, View } from "react-native";
import { createStore, Message, Model, Store } from ".";
import { cellStyle } from "./styles";

let store: Store<Model> = createStore("system", [], { sync: "manual" })


export default function CommunicationPanel() {

    // The system will call this on new messages
    const callback = (message: Message) => {
        setLog(prevLog => [...prevLog, message]);
    };

    const comm = store.useCom(callback);

    // We store all the messages here
    const [log, setLog] = React.useState<Message[]>([]);


    return (
        <>
            <Text style={{ fontWeight: 'bold' }}> Communication Panel </Text>
            <View style={{ flexBasis: "auto", flexDirection: "column", minWidth: 1280, paddingTop: 5 }}>
                <Text style={{ fontWeight: 'bold' }}> Change Log </Text>
                {log.map((entry, index) => (
                    <Text key={"CP_" + index} style={cellStyle} >
                        {entry.storeId} {entry.operation} {entry.cmd} {entry.payload ? JSON.stringify(entry.payload) : ""}

                    </Text>
                ))}
            </View>
        </>
    );
}


