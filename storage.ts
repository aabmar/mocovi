
import { Model } from './types';
import { isDifferent } from './util';

function createStorage<Data extends Model>(notify: () => void) {

    const internalStorage = new Map<string, Data>();
    const deleted = new Map<string, Data>();
    const inserted = new Map<string, Data>();
    const updated = new Map<string, Data>();
    const previous = new Map<string, Data>();

    function get(modelId: string): Data | null {
        return internalStorage.get(modelId) || null;
    }

    function set(model: Data): boolean {

        const original = internalStorage.get(model.id);
        const originalJ = JSON.parse(JSON.stringify(original));

        if (!isDifferent(original, model)) return false;


        if (original) {
            updated.set(model.id, model);
            previous.set(model.id, originalJ);
        } else {
            inserted.set(model.id, model);
        }

        internalStorage.set(model.id, model);
        notify();
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
        notify();
        return true;

    }

    function setArray(newCollection: Data[]): boolean {

        const existingKeys = new Set(internalStorage.keys());
        const newStorage = new Map<string, Data>(newCollection.map(m => [m.id, m]));
        const newKeys = new Set(newStorage.keys());

        // Calculate changes
        const coexistingKeys = new Set([...newKeys].filter(x => existingKeys.has(x)));
        const deletedKeys = new Set([...existingKeys].filter(x => !newKeys.has(x)));
        const insertedKeys = new Set([...newKeys].filter(x => !existingKeys.has(x)));
        const updatedKeys = new Set([...coexistingKeys].filter(x => isDifferent(internalStorage.get(x), newStorage.get(x))));

        if (deletedKeys.size > 0 || insertedKeys.size > 0 || updatedKeys.size > 0) {

            //Move data from storage to deleted
            for (let key of deletedKeys) {
                const original = internalStorage.get(key);
                deleted.set(key, original);
                internalStorage.delete(key);
                previous.set(key, JSON.parse(JSON.stringify(original)));
            }

            // Insert new data to storage
            for (let key of insertedKeys) {
                internalStorage.set(key, newStorage.get(key));
                inserted.set(key, newStorage.get(key));
            }

            // Update existing data
            for (let key of updatedKeys) {
                const original = internalStorage.get(key);
                const newModel = newStorage.get(key);
                internalStorage.set(key, newModel);
                updated.set(key, newModel);
                previous.set(key, JSON.parse(JSON.stringify(original)));
            }
            notify();
            return true;
        }

        return false;
    }

    function has(id: string) {
        return internalStorage.has(id);
    }

    function getAndResetChange() {
        const data = {
            inserted: Array.from(inserted.values()),
            updated: Array.from(updated.values()),
            deleted: Array.from(deleted.values()),
            previous: Array.from(previous.values())
        };

        inserted.clear();
        updated.clear();
        deleted.clear();
        previous.clear();

        return data;
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

    const storage = {
        get,
        set,
        delete: delete_,
        has,
        getAndResetChange,
        values,
        keys,
        setArray,
        size
    }

    return storage;
}

export { createStorage };