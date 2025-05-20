import logger, { LOG_LEVEL_INFO, setLog } from "./logger";
import { Model } from './types';
import { isDifferent } from './util';
const { err, log, dbg, level } = logger("storage");

// level(LOG_LEVEL_INFO);

function createStorage<Data extends Model>(storeId: string) {

    const internalStorage = new Map<string, Data>();
    const deleted = new Map<string, Data>();
    const inserted = new Map<string, Data>();
    const updated = new Map<string, Data>();
    const previous = new Map<string, Data>();

    function get(modelId: string): Data | null {
        return internalStorage.get(modelId) || null;
    }

    function getInternalStorage(): Map<string, Data> {
        return internalStorage;
    }

    function getFirst(): Data | null {
        return internalStorage.values().next().value || null
    }

    function getLast(): Data | null {
        const values = [...internalStorage.values()];
        return values.length > 0 ? values[values.length - 1] : null;

    }

    function getNewest(): Data | null {
        const values = [...internalStorage.values()];
        if (values.length === 0) {
            return null;
        }
        const sorted = values.sort((a, b) => {
            return (a.changed_at || a.updated_at || 0) > (b.changed_at || b.updated_at || 0) ? -1 : 1;
        });
        return sorted[0];
    }

    function getOldest(): Data | null {
        const values = [...internalStorage.values()];
        if (values.length === 0) {
            return null;
        }
        const sorted = values.sort((a, b) => {
            return (a.changed_at || a.updated_at || 0) < (b.changed_at || b.updated_at || 0) ? -1 : 1;
        });
        return sorted[0];
    }

    function set(model: Data): boolean {

        const original = internalStorage.get(model.id);

        let originalJ = null;

        if (original) {
            try {
                originalJ = JSON.parse(JSON.stringify(original));
            } catch (error) {
                err("Error parsing original model:", error);
                return false;
            }
        }

        dbg("set() ", original, model);

        if (!isDifferent(original, model)) {
            dbg("set() No changes", original, model);
            return false;
        }

        if (original) {
            updated.set(model.id, model);
            previous.set(model.id, originalJ);
        } else {
            inserted.set(model.id, model);
        }

        internalStorage.set(model.id, { ...model });
        return true;
    }

    function delete_(id: string): boolean {
        const original = internalStorage.get(id);

        if (!original) {
            return false;
        }

        internalStorage.delete(id);
        deleted.set(id, original);
        previous.set(id, JSON.parse(JSON.stringify(original)));
        return true;

    }

    function setArray(newCollection: Data[], skipChangeMarking?: boolean, deleteChanged?: boolean): boolean {

        dbg("setArray() ", newCollection, skipChangeMarking);
        const existingKeys = new Set(internalStorage.keys());
        const newStorage = new Map<string, Data>(newCollection.map(m => [m.id, m]));
        const newKeys = new Set(newStorage.keys());

        const markChange = !skipChangeMarking;

        // Calculate changes
        const coexistingKeys = new Set([...newKeys].filter(x => existingKeys.has(x)));
        const deletedKeys = new Set([...existingKeys].filter(x => !newKeys.has(x)));
        const insertedKeys = new Set([...newKeys].filter(x => !existingKeys.has(x)));
        const updatedKeys = new Set([...coexistingKeys].filter(x => isDifferent(internalStorage.get(x), newStorage.get(x))));

        dbg("setArray() deleted: ", deletedKeys);
        dbg("setArray() inserted: ", insertedKeys);
        dbg("setArray() updated: ", updatedKeys);

        if (deletedKeys.size > 0 || insertedKeys.size > 0 || updatedKeys.size > 0) {

            //Move data from storage to deleted
            for (let key of deletedKeys) {
                const original = internalStorage.get(key);

                // If we should delete changed models, or if the model has not been changed
                const modelHasChanged = original.changed_at ? true : false;

                if (deleteChanged || !modelHasChanged) {
                    internalStorage.delete(key);
                    if (markChange) {
                        deleted.set(key, original);
                        previous.set(key, JSON.parse(JSON.stringify(original)));
                    }
                }
            }


            // Insert new data to storage
            for (let key of insertedKeys) {
                internalStorage.set(key, newStorage.get(key));
                if (markChange) {
                    inserted.set(key, newStorage.get(key));
                }
            }

            // Update existing data
            for (let key of updatedKeys) {
                const original = internalStorage.get(key);
                const newModel = newStorage.get(key);
                internalStorage.set(key, newModel);
                if (markChange) {
                    previous.set(key, JSON.parse(JSON.stringify(original)));
                    updated.set(key, newModel);
                }
            }

            dbg("After setArray() storage, we have logged changes:", storeId, inserted.size, updated.size, deleted.size);
            return true;
        }

        return false;
    }

    function has(id: string) {
        return internalStorage.has(id);
    }

    function getAndResetChange() {
        const changes = {
            storeId,
            inserted: Array.from(inserted.values()),
            updated: Array.from(updated.values()),
            deleted: Array.from(deleted.values()),
            previous: Array.from(previous.values())
        };

        inserted.clear();
        updated.clear();
        deleted.clear();
        previous.clear();

        return changes;
    }

    function values() {
        return internalStorage.values();
    }

    function keys() {
        return internalStorage.keys();
    }

    function size() {
        return internalStorage.size;
    }

    function clear() {
        internalStorage.clear();
        getAndResetChange();
    }
    const storage = {
        get,
        getInternalStorage,
        getFirst,
        getLast,
        getNewest,
        getOldest,
        set,
        delete: delete_,
        has,
        getAndResetChange,
        values,
        keys,
        setArray,
        size,
        clear
    }

    return storage;
}

export { createStorage };
