import { Text, View } from "react-native";
import { Model, Store } from "./types";

export default function ModelView({ store, }: { store: Store<Model> }) {
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