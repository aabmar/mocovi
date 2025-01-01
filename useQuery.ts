
function createUseQuery(store: any) {
    // function useQuery(path: string | string[]) {
    //     const modelId = selectedModelId;

    //     // console.log("useQuery() ", path, modelId);

    //     if (!modelId) {
    //         console.log("useQuery() called without modelId and no model is selected");
    //         return [null, () => { }];
    //     }

    //     const model_ = collectionData[findModelIndexById(collectionData, modelId)] || {} as Data;
    //     const initialModel = getObjectByKey(model_, path);
    //     const [model, setModel] = useState<Data>(initialModel);


    //     useEffect(() => {

    //         function handleChange(d: Data[]) {
    //             const idx = findModelIndexById(d, modelId);
    //             const newModel_ = { ...d[idx] }
    //             const newModel = getObjectByKey(newModel_, path);
    //             // console.log("useQuery() handleChange() ", newModel.id);
    //             if (newModel.id === "c0.0") {
    //                 console.log("useQuery() handleChange() equal? ", deepEqual(model, newModel), model, newModel);
    //             }
    //             if (deepEqual(model, newModel)) return;

    //             setModel(idx === -1 ? {} as Data : { ...newModel });
    //         }
    //         eventHandler.subscribe(handleChange);
    //         return () => {
    //             eventHandler.unsubscribe(handleChange);
    //         };
    //     }, [modelId]);

    //     const setModelData = (newModel: Data) => {
    //         console.error("useQuery() setModelData() not implemented. get from set field with path from old version");
    //     };

    //     return [model, setModelData] as [Data, (newModel: Data) => void];
    // }
    throw new Error("Currently not supported");
    return null;
}