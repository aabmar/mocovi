import { Pressable, Text, View } from "react-native";
import { Model, Store } from "./types";
import { buttonStyle, cellStyle, infoStyle } from "./styles";


export default function ModelList({ store }: { store: Store<Model> }) {

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

    // List All Models in a Collection

    return (
        <>
            <Text style={{ fontWeight: 'bold' }}> Store: {store.id} </Text>

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignContent: "center", alignItems: "center" }}>
                <Pressable onPress={handleFetch} style={buttonStyle}><Text numberOfLines={1}>Fetch</Text></Pressable>
                <Pressable onPress={handleReload} style={buttonStyle}><Text numberOfLines={1}>Reload</Text></Pressable>
                <Text style={infoStyle} numberOfLines={1}> Length: {collection.length} </Text>
                <Text ellipsizeMode="head" style={[infoStyle, { flex: 1 }]} numberOfLines={1}> Selected: {selected ? selected.id : 'None'}</Text>
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

