import {Text, TextInput} from "react-native";
import {useStore} from ".";


export default function Input({label, field, storeName, data, dispatch, onChange}) {

        console.log("%% RENDER %% Input() label: ", label, " field: ", field, " storeName: ", storeName, " data: ", data, " dispatch: ", dispatch, " onChange: ", onChange);
    
        // If we have a storeName, we will use the hook to get the store
        if(storeName){
            console.log("Input() We have a storeName, so looking it up using useStore()");
            if(data || dispatch || onChange) throw new Error("Input() should not have 'data', 'dispatch' or 'onChange' when 'storeName' is provided");
            const store = useStore(storeName);
            data = store[0];
            dispatch = store[1];
        } else{
            // No store name, make sure we have data
            if(!data) throw new Error("Input() should have 'data' and 'dispatch' or 'onChange' when 'storeName' is not provided");
            // Make sure we have either dispatch or onChange
            if( (dispatch && onChange) || (!dispatch && !onChange ) ) throw new Error("Input() should have either 'dispach' or 'onChange' when storeName is not provided");
        }
        // If we don't have a onChange function when we come here, we have to make it.
        if(!onChange){
            console.log("Input() We don't have an onChange function, so we will make one");
            onChange = (text) => {
                console.log("Input() onChange() field: ", field, " text: ", text);
    
                if(text instanceof Object) {
                    text = text.nativeEvent.text;
                }
    
                const action = { type: "field", payload: { key: field, value: text }};
                console.log("Input onChange(): ", action);
                dispatch( (data) => (action)  );
            }
        }
    
        // Just for clarity, we get the correct value here
        const value = data[field];
    
        return (
            <>
                <Text>{label}</Text>
                <TextInput style={{...style.textInput,  }} placeholder={label} value={value} onChangeText={(text) => {onChange(text)}} />
            </>
        );
    }
    