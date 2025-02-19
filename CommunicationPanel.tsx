import React, { useEffect } from "react";
import { NativeSyntheticEvent, Text, TextInput, View } from "react-native";
import { createStore, Message, Model, Store } from ".";
import { cellStyle } from "./styles";

let store: Store<Model> = createStore("system", [], { sync: "auto" })


export default function CommunicationPanel() {

    // The system will call this on new messages
    const callback = (message: Message) => {
        console.log("CommunicationPanel CALLBACK::: ", message);
        setLog(prevLog => [...prevLog, message]);
    };

    const comm = store.useCom(callback);

    // We store all the messages here
    const [log, setLog] = React.useState<Message[]>([]);
    const [broadcast, setBroadcast] = React.useState<string>("");

    useEffect(() => {
        // We send a message to the system
        setTimeout(() => {
            comm.send("ping", { time: new Date().toISOString() }, "broadcast");

        }, 1000);
    }, []);

    const handleBroadcast = (e: NativeSyntheticEvent<any>) => {

        // If user pressed enter, we send a broadcast message and clear the input
        if (e.nativeEvent.key !== "Enter") {
            return;
        }

        if (!broadcast) return;

        comm.send("broadcast", { message: broadcast }, "broadcast");

        setBroadcast("");
    };


    if (!log) {
        return <Text> No messages </Text>
    }
    return (
        <View style={{ flexBasis: "auto", flexDirection: "column", padding: 5, backgroundColor: "#bbb" }}>
            <Text style={{ fontWeight: 'bold' }}> Communication Panel </Text>

            <TextInput style={cellStyle} placeholder="Type message" placeholderTextColor="#888" onKeyPress={handleBroadcast} value={broadcast} onChangeText={setBroadcast} />

            {log.map((entry, index) => (
                <Text key={"CP_" + index} style={cellStyle} >
                    {entry.storeId} {entry.operation} {entry.cmd} {entry.payload ? JSON.stringify(entry.payload) : ""}

                </Text>
            ))}
        </View>
    );
}


