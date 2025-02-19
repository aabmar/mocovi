import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { getStores } from "./Store";
import { Model, Store } from "./types";
import ModelList from "./ModelList";
import ModelView from "./ModelView";
import { cellStyle } from "./styles";

export default function StorePanel() {

    const [selectedStore, setSelectedStore] = useState<Store<Model> | null>(null);
    const stores = Array.from(getStores().values());

    return (


        <View style={{ flexBasis: "auto", flexDirection: "row", paddingTop: 5 }}>

            <View style={{ flex: 1, flexDirection: "column", backgroundColor: "lightgray", padding: 8 }}>
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
            </View>

            <View style={{ flex: 3, backgroundColor: "lightgray", padding: 8 }}>
                {selectedStore ? <ModelList store={selectedStore} key={"ML_" + selectedStore.id} /> : <Text> Select a store </Text>}
            </View>

            <View style={{ flex: 3, backgroundColor: "lightgray", padding: 8 }}>
                {selectedStore ? <ModelView store={selectedStore} key={"MV_" + selectedStore?.id} /> : <Text> Select a store </Text>}
            </View>
        </View>


    );
}


