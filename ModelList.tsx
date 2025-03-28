import { Pressable, Text, View } from "react-native";
import { Model, Collection } from "./types";
import { buttonStyle, cellStyle, infoStyle } from "./styles";


export default function ModelList({ collection }: { collection: Collection<Model> }) {

    const controller = collection.baseController;
    const [data] = collection.useCollection();
    const [selected] = collection.useSelected();

    const handleFetch = () => {
        collection.baseController.fetch();
    };
    const handleReload = () => {
        collection.baseController.clear();
        collection.baseController.fetch();
    };

    // List All Models in a Collection

    return (
        <>
            <Text style={{ fontWeight: 'bold' }}> Collection: {collection.id} </Text>

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignContent: "center", alignItems: "center" }}>
                <Pressable onPress={handleFetch} style={buttonStyle}><Text numberOfLines={1}>Fetch</Text></Pressable>
                <Pressable onPress={handleReload} style={buttonStyle}><Text numberOfLines={1}>Reload</Text></Pressable>
                <Text style={infoStyle} numberOfLines={1}> Length: {data.length} </Text>
                <Text ellipsizeMode="head" style={[infoStyle, { flex: 1 }]} numberOfLines={1}> Selected: {selected ? selected.id : 'None'}</Text>
            </View>

            {
                data.map((model) => {
                    const data = model as any;
                    const value = data.name || data.title || data.phone || data.email || data.id;
                    const key = data.id;
                    return (
                        <Pressable style={model.id === selected?.id ? { ...cellStyle, backgroundColor: 'lightblue' } : cellStyle} key={key} onPress={() => {
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

