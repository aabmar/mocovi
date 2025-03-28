import React, { useEffect } from "react";
import { NativeSyntheticEvent, Text, TextInput, View } from "react-native";
import { createCollection, Message, Model, Collection } from ".";
import { cellStyle } from "./styles";
import useLog from "./logger";

const { log, dbg } = useLog("CommunicationPanel");

let collection: Collection<Model> = createCollection("system", [], { sync: "auto" });

export default function CommunicationPanel() {

    // The system will call this on new messages
    const callback = (message: Message) => {
        dbg("CommunicationPanel CALLBACK::: ", message);
        setLog(prevLog => [...prevLog, message]);
    };

    const comm = collection.useCom(callback);

    // We store all the messages here
    const [logEntries, setLog] = React.useState<Message[]>([]);
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


    if (!logEntries) {
        return <Text> No messages </Text>
    }
    return (
        <View style={{ flexBasis: "auto", flexDirection: "column", padding: 5, backgroundColor: "#bbb" }}>
            <Text style={{ fontWeight: 'bold' }}> Communication Panel </Text>

            <TextInput style={cellStyle} placeholder="Type message" placeholderTextColor="#888" onKeyPress={handleBroadcast} value={broadcast} onChangeText={setBroadcast} />

            {logEntries.map((entry, index) => (
                <Text key={"CP_" + index} style={cellStyle} >
                    {entry.storeId} {entry.operation} {entry.cmd} {entry.payload ? JSON.stringify(entry.payload) : ""}

                </Text>
            ))}
        </View>
    );
}


