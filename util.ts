
import logger, { LOG_LEVEL_DEBUG, LOG_LEVEL_INFO } from "./logger";
const { log, err, dbg, level } = logger("util");

level(LOG_LEVEL_INFO);

/**
 * Compare two objects and return the differences
 * @param name The name of the object being compared
 * @param oldObject The old version of the object
 * @param newObject The new version of the object
 * @param changes An array to collect the changes
 * @returns The array of changes
 */

function diff(name: string, oldObject: any, newObject: any, changes: string[]) {

    // A set with all keys of a and b
    const keys = new Set([...Object.keys(oldObject || {}), ...Object.keys(newObject || {})]);

    keys.forEach(key => {

        const oldValue = oldObject[key];
        const newValue = newObject[key];

        if (oldValue === undefined && typeof newValue === "object" && newValue !== null) {
            diff(name + "." + key, {}, newValue, changes);
        } else if (newValue === undefined && typeof oldValue === "object" && oldValue !== null) {
            diff(name + "." + key, oldValue, {}, changes);
        } else if (typeof oldValue === "object" && oldValue !== null
            && typeof newValue === "object" && newValue !== null) {
            diff(name + "." + key, oldValue, newValue, changes);
        } else {
            if (oldValue === undefined) {
                dbg("¤¤¤ NEW:", name + "." + key + "=" + newValue);
                changes.push("NEW:" + name + "." + key + "=" + newValue);
            } else if (newValue === undefined) {
                dbg("¤¤¤ DELETED:", name + "." + key + "=" + oldValue);
                changes.push("DELETED:" + name + "." + key + "=" + oldValue);
            } else if (oldValue !== newValue) {
                dbg("¤¤¤ CHANGED:", name + "." + key + "=" + oldValue + " -> " + newValue);
                changes.push("CHANGED:" + name + "." + key + "=" + oldValue + " -> " + newValue);
            }
        }

    });

    return changes;
}

/**
 * Compare two models and return the differences
 * @param previousModel The previous model
 * @param currentModel The current model
 * @returns An object with the differences
 */
function modelDiff(previousModel: { [key: string]: any }, currentModel: { [key: string]: any }): { [key: string]: any } {
    const changes: { [key: string]: any } = {};
    const combinedKeys = [...new Set([...Object.keys(previousModel), ...Object.keys(currentModel)])];

    for (let key of combinedKeys) {
        if (key === "id") continue;
        // if (key.endsWith("_at")) continue;
        if (previousModel[key] && !currentModel[key]) {
            changes[key] = null;
            continue;
        }
        if (previousModel[key] !== currentModel[key]) {
            changes[key] = currentModel[key];
            continue;
        }
    }

    return changes;

}

/**
 * Check if two models are different
 * @param oldModel The old model
 * @param newModel The new model
 * @returns true if the models are different, false otherwise
 */
function isDifferent(oldModel: { [key: string]: any } | undefined, newModel: { [key: string]: any }): boolean {
    dbg("isDifferent: oldModel", oldModel);
    dbg("isDifferent: newModel", newModel);
    if (!oldModel && !newModel) {
        return false;
    }
    if (!oldModel || !newModel) {
        dbg("isDifferent: one of the models is undefined");
        return true;
    }

    if (Object.keys(oldModel).length !== Object.keys(newModel).length) {
        console.warn("isDifferent: different number of keys", Object.keys(oldModel).length, Object.keys(newModel).length);
        return true
    }

    const combinedKeys = [...new Set([...Object.keys(oldModel), ...Object.keys(newModel)])];

    for (let key of combinedKeys) {
        const oldValue = oldModel[key];
        const newValue = newModel[key];

        if (key === "id") continue;
        if (key === "changed_at") continue;
        if (key === "synced_at") continue;
        if (key === "created_at") continue;
        if (key === "updated_at") continue;

        if (typeof oldValue !== typeof newValue) {
            dbg("isDifferent: different type ", key, typeof oldValue, typeof newValue);
            return true;
        }

        if (oldValue === null && newValue === null) continue;
        if (oldValue === undefined && newValue === undefined) continue;

        // If it is a number, string or boolean, compare directly
        if (typeof oldValue === "number" || typeof oldValue === "string" || typeof oldValue === "boolean") {
            if (oldValue !== newValue) {
                dbg("isDifferent: key ", key, oldValue, newValue);
                return true;
            }
            continue;
        }
        // If this is an array, iterate it
        if (Array.isArray(oldValue) && Array.isArray(newValue)) {
            if (oldValue.length !== newValue.length || oldValue.some((val, index) => val !== newValue[index])) {
                dbg("isDifferent: array length or content mismatch in", key);
                return true;

            }
            // Iterate through the array and compare each element
            for (let i = 0; i < oldValue.length; i++) {
                const o = oldValue[i];
                const n = newValue[i];
                if (typeof o !== typeof n) {
                    dbg("isDifferent: array element type mismatch in", key, "at index", i, typeof o, typeof n);
                    return true;
                }
                // If type is object, recurse
                if (typeof o === "object" && typeof n === "object") {
                    if (isDifferent(o, n)) {
                        dbg("isDifferent: array element mismatch in", key, "at index", i);
                        return true;
                    }
                }
                // If type is number, string or boolean, compare directly
                else if (o !== n) {
                    dbg("isDifferent: array element mismatch in", key, "at index", i, o, n);
                    return true;
                }
            }
            continue;
        }
        // If it this is an object, recurse
        if (typeof oldModel[key] === "object" && typeof newModel[key] === "object") {
            if (isDifferent(oldModel[key], newModel[key])) {
                return true;
            }
            continue;
        }


    }
    dbg("isDifferent: no differences found");
    return false;
}

export { diff, isDifferent, modelDiff };
