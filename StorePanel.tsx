import React, { useState } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import ModelList from "./ModelList";
import ModelView from "./ModelView";
import { getStores } from "./Store";
import { cellStyle } from "./styles";
import { Model, Collection } from "./types";
import { Picker } from "@react-native-picker/picker";


// Show a list of collections in the Store

export default function StorePanel() {
    const dim = useWindowDimensions();

    const [selectedStore, setSelectedStore] = useState<Collection<Model> | null>(null);
    const stores = Array.from(getStores().values());

    return (


        <View style={dim.width > 800 ? styles.wide : styles.narrow}>
            <Picker
                selectedValue={selectedStore?.id}
                onValueChange={(itemValue) => setSelectedStore(getStores().get(itemValue))}
                style={{ margin: 5 }}
            >

                {stores.map((store) => (
                    <Picker.Item key={store.id} label={store.id} value={store.id} />
                ))}
            </Picker>

            {/* <View style={{ flexBasis: "auto", flexDirection: "column", backgroundColor: "lightgray", padding: 8 }}>
                {
                    stores.map((store) => (
                        <Pressable
                            key={store.id}
                            onPress={() => setSelectedStore(store)}
                            style={cellStyle}
                        >
                            <Text style={{ fontWeight: store.id === selectedStore?.id ? 'bold' : 'normal' }}> {store.id} </Text>
                        </Pressable>
                    ))
                }
            </View> */}

            <View style={{ flexBasis: "auto", backgroundColor: "lightgray", padding: 8 }}>
                {selectedStore ? <ModelList collection={selectedStore} key={"ML_" + selectedStore.id} /> : <Text> Select a store </Text>}
            </View>

            <View style={{ flexBasis: "auto", backgroundColor: "lightgray", padding: 8 }}>
                {selectedStore ? <ModelView store={selectedStore} key={"MV_" + selectedStore?.id} /> : <Text> Select a store </Text>}
            </View>
        </View>


    );
}


const styles = StyleSheet.create({
    narrow: {
        flex: 1,
        flexDirection: "column",
        justifyContent: "flex-start",
    },
    wide: {
        flex: 1,
        flexDirection: "row",
        justifyContent: "flex-start",
        alignContent: "center",
        alignItems: "center"
    }
})
