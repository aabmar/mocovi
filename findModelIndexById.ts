
function findModelIndexById<Data extends { id: any }>(collection: Data[], modelId: any): number {
    return collection.findIndex(item => item.id === modelId);
}

export { findModelIndexById };
