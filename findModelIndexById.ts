function findModelIndexById<Data extends { id: string }>(collection: Data[], modelId: string): number {
    return collection.findIndex(item => item.id === modelId);
}

function findModelById<Data extends { id: string }>(collection: Data[], modelId: string): Data | null {
    const index = findModelIndexById(collection, modelId);
    return index !== -1 ? collection[index] : null;
}
export { findModelIndexById, findModelById };
