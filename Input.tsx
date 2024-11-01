import { Text, TextInput } from "react-native";
import React from "react";


export default function Input({ label, field, data, dispatch, style }) {

    console.log("%% RENDER %% Input() label: ", label, " field: ", field, " data: ", data, " dispatch: ", dispatch);

    // No store name, make sure we have data
    if (!data) throw new Error("Input() should have 'data'");

    // Make sure we have either dispatch or onChange
    if (!dispatch) throw new Error("Input() should have either 'dispach'");

    // If we don't have a onChange function when we come here, we have to make it.
    const onChange = (text) => {
        console.log("Input() onChange() field: ", field, " text: ", text);

        if (text instanceof Object) {
            text = text.nativeEvent.text;
        }

        const action = { type: "field", payload: { key: field, value: text } };
        console.log("Input onChange(): ", action);
        dispatch((data) => (action));
    }

    // Just for clarity, we get the correct value here
    const value = data[field];

    return (
        <>
            <Text>{label}</Text>
            <TextInput style={style ? { ...style.textInput, } : {}} placeholder={label} value={value} onChangeText={(text) => { onChange(text) }} />
        </>
    );
}
