
function findModelIndexById<Data extends { id: any }>(collection: Data[], modelId: any): number {
    return collection.findIndex(item => item.id === modelId);
}

function findModelById<Data extends { id: any }>(collection: Data[], modelId: any): Data {
    return collection[findModelIndexById(collection, modelId)];
}
export { findModelIndexById, findModelById };

