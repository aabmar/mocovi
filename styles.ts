import { TextStyle, ViewStyle } from "react-native";

const cellStyle: ViewStyle = {
    margin: 4,
    backgroundColor: "white",
    padding: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "gray",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden"
};

const buttonStyle: ViewStyle = {
    flexBasis: "auto",
    borderWidth: 1,
    padding: 2,
    margin: 2
};

const infoStyle: TextStyle = {
    flexBasis: "auto",
    borderWidth: 1,
    padding: 2,
    margin: 2,
    borderColor: "#aaa"
};


export { cellStyle, buttonStyle, infoStyle }