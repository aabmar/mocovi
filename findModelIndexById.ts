function findModelIndexById<Data extends { id: string }>(collection: Data[], modelId: string | null): number {
    if (!modelId) {
        console.error("Model ID is null or undefined");
        return -1;
    }
    const index = collection.findIndex(item => item.id === modelId);
    if (index === -1) {
        console.error(`Model with ID ${modelId} not found`);
    }
    return index;
}

function findModelById<Data extends { id: string }>(collection: Data[], modelId: string | null): Data | null {
    if (!modelId) {
        console.error("Model ID is null or undefined");
        return null;
    }
    const index = findModelIndexById(collection, modelId);
    if (index === -1) {
        console.error(`Model with ID ${modelId} not found`);
        return null;
    }
    return collection[index];
}

export { findModelIndexById, findModelById };
