import React from "react";
import { Text, View } from "react-native";
import { useHistory } from "../history";
import StorePanel from "./StorePanel";
import { cellStyle } from "./styles";

export default function HistoryPanel() {

    const history = useHistory();

    return (
        <>
            <View style={{ flexBasis: "auto", flexDirection: "column", minWidth: 1280, paddingTop: 5 }}>
                <Text style={{ fontWeight: 'bold' }}> Change Log </Text>
                {history.map((entry, index) => (
                    <Text key={"H_" + index} style={cellStyle} >
                        {entry.storeId} U: {entry.updated.length} D: {entry.deleted.length} I: {entry.inserted.length}

                    </Text>
                ))}
            </View>
        </>
    );
}


