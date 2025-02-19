import React from "react";
import CommunicationPanel from "./CommunicationPanel";
import HistoryPanel from "./HistoryPanel";
import StorePanel from "./StorePanel";
import { Pressable, Text, View } from "react-native";
import { buttonStyle } from "./styles";

export default function StoreInspector() {

    const [showCommunicationPanel, setShowCommunicationPanel] = React.useState<boolean>(true);

    const toggleCommunicationPanel = () => {
        setShowCommunicationPanel(prev => !prev);
    };

    return (
        <>

            {/* <StorePanel /> */}


            <View style={{
                flexDirection: "row", justifyContent: "flex-start", alignContent: "center", alignItems: "center", padding: 5, backgroundColor: "#bbb"
            }}>
                <Pressable onPress={toggleCommunicationPanel} style={buttonStyle}>
                    <Text>{showCommunicationPanel ? "Hide Communication Panel" : "Show Communication Panel"}</Text>
                </Pressable>
            </View>

            {showCommunicationPanel && <CommunicationPanel />}



            <HistoryPanel />

        </>
    );
}


