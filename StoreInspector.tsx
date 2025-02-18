import { Model, Store } from "./types";
import { getStores } from "./Store"
import React, { useEffect, useState } from "react";
import { Pressable, Text, View, ViewStyle } from "react-native";
import { useHistory } from "./history";

export default function StoreInspector() {

    const [selectedStore, setSelectedStore] = useState<Store<Model> | null>(null);
    const history = useHistory();

    const stores = Array.from(getStores().values());

    function ModelList({ store }: { store: Store<Model> }) {

        const controller = store.baseController;
        const [collection] = store.useCollection();
        const [selected] = store.useSelected();

        // useEffect(() => {
        //     store.baseController.fetch();
        //     // controller.select(null);
        // }, []);

        const handleFetch = () => {
            store.baseController.fetch();
        };
        const handleReload = () => {
            store.baseController.clear();
            store.baseController.fetch();
        };

        return (
            <>
                <Text style={{ fontWeight: 'bold' }}> Store: {store.id} </Text>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Pressable onPress={handleFetch} style={{ flexBasis: "auto" }}><Text numberOfLines={1}>Fetch</Text></Pressable>
                    <Pressable onPress={handleReload} style={{ flexBasis: "auto" }}><Text numberOfLines={1}>Reload</Text></Pressable>
                    <Text style={{ flexBasis: "auto" }} numberOfLines={1}> Length: {collection.length} </Text>
                    <Text ellipsizeMode="head" style={{ flex: 1 }} numberOfLines={1}> Selected: {selected ? selected.id : 'None'}</Text>
                </View>

                {
                    collection.map((model) => {
                        const data = model as any;
                        const value = data.name || data.title || data.phone || data.email || data.id;
                        return (
                            <Pressable style={model.id === selected?.id ? { ...cellStyle, backgroundColor: 'lightblue' } : cellStyle} key={model.id} onPress={() => {
                                controller.select(model.id);
                            }}>
                                <Text> {value} </Text>
                            </Pressable>
                        )
                    })
                }
            </>
        );
    }

    function ModelView({ store, }: { store: Store<Model> }) {
        const [model] = store.useSelected();

        if (!model) {
            return <Text> Select a model </Text>
        }

        const data = model as any;
        const fields = Object.keys(data);

        // We are going to show time fields first, so we shift out fields ending in "_at"
        const timeFields = fields.filter((field) => field.endsWith("_at"));
        const dataFields = fields.filter((field) => !field.endsWith("_at") && field !== "id");



        return (
            <>
                <Text style={{ fontWeight: 'bold', marginBottom: 8 }}> Model: {model.id} </Text>

                {timeFields.map((field) => (
                    <View key={"MV_K_" + field} style={{ flexDirection: "row", justifyContent: "flex-start", alignContent: "center" }}>
                        <Text style={{ flex: 2, fontWeight: "bold" }}>{field}</Text>
                        <Text style={{ flex: 4 }}>{data[field] instanceof Date ? data[field].toISOString() : String(data[field])}</Text>
                    </View>
                ))}

                {dataFields.map((field) => (
                    <View key={"MV_K_" + field} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text style={{ flex: 2, fontWeight: 'bold' }}>{field}</Text>
                        <Text style={{ flex: 4 }}>{String(data[field])}</Text>

                    </View>
                ))}
            </>
        )
    }

    return (
        <>

            <View style={{ flexBasis: "auto", flexDirection: "row", minWidth: 1280, paddingTop: 5 }}>

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


const cellStyle: ViewStyle = {
    margin: 4,
    backgroundColor: "white",
    padding: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "gray",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
};
