
import logger, { LOG_LEVEL_DEBUG } from "./logger";
const { log, err, dbg, level } = logger("util");

// level(LOG_LEVEL_DEBUG);


// Print the differences between two objects with deep path
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

// This function takes an array of previous models and of current model and retruns
// an array of HistoryDiff objects. Each HistoryDiff contains the original model,
// the type of change (insert, update, delete), a change object with the changes, and the new model.
// function modelArrayDiff(previousModels: Model[], currentModels: Model[]): ChangeEntry[] {
//     const changes: ChangeEntry[] = [];

//     const combinedIds = new Set([...previousModels.map(m => m.id), ...currentModels.map(m => m.id)]);

//     combinedIds.forEach(id => {
//         const previousModel = previousModels.find(m => m.id === id);
//         const currentModel = currentModels.find(m => m.id === id);

//         let entry: ChangeEntry | undefined;

//         // Find deleted model
//         if (previousModel && !currentModel) {
//             entry = {
//                 id: previousModel.id,
//                 type: "delete",
//                 from: previousModel,
//                 change: modelDiff(previousModel, {}),
//                 to: null
//             };
//             changes[id] = entry;
//         } else if (currentModel && isDifferent(previousModel, currentModel)) {
//             changes[id] = currentModel;
//         }
//     });

//     return changes;
// }

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

    if (Object.keys(oldModel).length !== Object.keys(newModel).length) return true;

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
            continue;
        }
        // If it this is an object, recurse
        if (typeof oldModel[key] === "object" && typeof newModel[key] === "object") {
            if (isDifferent(oldModel[key], newModel[key])) {
                return true;
            }
            continue;
        }

        // if (oldModel[key] !== newModel[key]) {
        //     // dbg("isDifferent: ", key, oldModel[key], newModel[key]);
        //     return true;
        // }
    }
    return false;
}

export { diff, isDifferent, modelDiff };
