function findModelIndexById<Data extends { id: string }>(collection: Data[], modelId: string | null): number {
    if (!modelId) return -1;
    return collection.findIndex(item => item.id === modelId);
}

function findModelById<Data extends { id: string }>(collection: Data[], modelId: string | null): Data | null {
    if (!modelId) return null;
    const index = findModelIndexById(collection, modelId);
    return index !== -1 ? collection[index] : null;
}
export { findModelIndexById, findModelById };
