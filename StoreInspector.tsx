import React from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import CommunicationPanel from "./CommunicationPanel";
import HistoryPanel from "./HistoryPanel";
import { buttonStyle } from "./styles";
import StorePanel from "./StorePanel";


export default function StoreInspector() {

    const [showCommunicationPanel, setShowCommunicationPanel] = React.useState<boolean>(true);

    const toggleCommunicationPanel = () => {
        setShowCommunicationPanel(prev => !prev);
    };

    return (
        <View>
            <HistoryPanel />

            <View style={{
                flexDirection: "row", justifyContent: "flex-start", alignContent: "center", alignItems: "center", padding: 5, backgroundColor: "#bbb"
            }}>
                <Pressable onPress={toggleCommunicationPanel} style={buttonStyle}>
                    <Text>{showCommunicationPanel ? "Hide Communication Panel" : "Show Communication Panel"}</Text>
                </Pressable>
            </View>

            {showCommunicationPanel && <CommunicationPanel />}

            <StorePanel />



        </View>
    );
}


