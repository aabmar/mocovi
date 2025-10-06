
// Look up a value in an object by a path of keys

function lookup(obj: any, keys: any[]): any {
    let k = keys[0];

    if (k === undefined || k.length === 0) {
        // console.log("In level: ", depth, " returning object: ", obj);
        return obj;
    }

    if (!obj) {
        return undefined;
    }

    // console.log("Looking for key: ", k, " at depth: ", depth++ , " witg parsedKey: ", keys);

    let foundObj = undefined;

    if (k.startsWith("$")) {
        // console.log("Looking for ID: ", k);
        let id = k.substring(1);
        if (Array.isArray(obj)) {
            foundObj = obj.find((o: any) => o.id === id);
        } else if (typeof obj === "object") {
            // Object doesent have find, but we still have to search through to find a child object where id is equal to the key
            for (let key in obj) {
                let child = obj[key];
                if (typeof child === "object") {
                    if (child.id === id) {
                        foundObj = obj[key];
                        break;
                    }
                }
            }
        }

    } else {
        // console.log("Looking for KEY: ", k);
        if (Array.isArray(obj)) {
            let index = parseInt(k);
            foundObj = obj[index];
        } else if (typeof obj === "object") {
            foundObj = obj[k];
        }
    }
    // console.log("..Found object.");
    if (foundObj === undefined) return undefined;
    return lookup(foundObj, keys.slice(1));
}

export { lookup };
