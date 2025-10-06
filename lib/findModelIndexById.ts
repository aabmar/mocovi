function findModelIndexById<Data extends { id: string }>(collection: Data[], modelId: string | null): number {
    if (!modelId) {
        return -1;
    }
    const index = collection.findIndex(item => item.id === modelId);
    return index;
}

function findModelById<Data extends { id: string }>(collection: Data[], modelId: string | null): Data | null {
    if (!modelId) {
        return null;
    }
    const index = findModelIndexById(collection, modelId);
    if (index === -1) {
        return null;
    }
    return collection[index];
}

export { findModelIndexById, findModelById };
