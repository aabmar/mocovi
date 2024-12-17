import { lookup } from './lookup';

// This is a helper function to do a deep lookup in an object.
// A text identifies a key name, a number identifies a key name org index in an array,
// a $ prefix will look for an object where the field "id" is equal to the value.
// The key is formatted like this: "a.1.$c" and the function will
// return an objct with id="c" in the array at index 1 in the object "a".

function getObjectByKey(obj: any | any[], key: any | [] | string | undefined) {

    // console.log("getObjectByKey() called with key: ", key);

    if (!key) return obj;
    if (!obj) return undefined;

    let keys: any[];
    if (Array.isArray(key)) {
        keys = key;
    } else if (typeof key === "string") {
        keys = key.split(".");
    } else {
        keys = [key];
    }
    let depth = 0;

    return lookup(obj, keys);
}

export { getObjectByKey };
