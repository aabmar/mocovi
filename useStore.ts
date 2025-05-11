import { useContext, useEffect, useState } from "react";
import { findModelById } from "./findModelIndexById";
import { nanoid } from "./nanoid";
import { Collection, Model, Store, UseModel, UseModelReturn } from "./types";
import { StoreContext } from "./StoreContext";

import  useLog from "./logger";

const {log, dbg, err, level} = useLog("useStore");

let counter = 0;

export default function useStore<Data extends Model>(collectionName: string, id?: string | true, fields?: string[]) {


    const [changed, setChanged] = useState(0);

    const store: Store = useContext(StoreContext);

    const name = collectionName + (id ? `/${id}` : "") + (fields ? `/${fields.join("|")}` : "") + ` [${counter++}]`;

    if (!store.collections[collectionName]) {
        throw new Error(`Collection ${collectionName} not found`);
    }
    const baseController = store.collections[collectionName].baseController;

    // Get the data from the collection
    const collection = baseController.getCollection();

    let model: Data | null = null;    
    if(id === true) model = baseController.getSelected();
    else if (id) model = baseController.get(id); 

    const currentId = model?.id;

    let requestedFields: {[key: string]: any} = {};
    if(fields) {
        for (const field of fields) {
            if (model && model[field] !== undefined) {
                requestedFields[field] = model[field];
            }
        }
    }

    useEffect(() => {

        // Make a subscription to changes in the data
        function handleChange(d: Data[]) {

            // If user requested selected or a specific model
            if(id) {
                let newModel: Data | null = null;    
                if(id === true) newModel = baseController.getSelected();
                else if (id) newModel = baseController.get(id); 

                // If selected fields, we check if the fields have changed
                if(fields) {
                    for (const field of fields) {
                        if ( model[field] !== newModel[field] ) {
                            setChanged((prev: number) => {
                                return prev + 1;
                            });
                            return;
                        }
                    }
                }

                // Else we check if the model has changed
                if(newModel !== model) {
                    setChanged((prev: number) => {
                        return prev + 1;
                    });
                }
                return;
            }


            // We did not get a specific model, so we check if the collection has changed
            if(collection.length !== d.length) {
                setChanged((prev: number) => {
                    return prev + 1;
                });
                return;
            }

            // Iterate over the models and check if any of them have changed
            for (let i = 0; i < d.length; i++) {
                const currentModel = d[i];
               const previousModel = collection[i];
               if(!currentModel || !previousModel) {
                    setChanged((prev: number) => {
                        return prev + 1;
                    });
                    return;
                }
            }
        }

        // Subscribe to changes in the collection
        dbg("USE STORE: Subscribing to changes in collection: ", name);
        store.collections[collectionName].eventHandler.subscribe(handleChange);

        // Unsubscribe when the component is unmounted
        return () => {
            dbg("USE STORE: Unsubscribing from changes in collection: ", name);
            store.collections[collectionName].unsubscribe(handleChange);
        };
    }, []);

    const set = (newModel: Data) => {
        if (!newModel.id) {
            newModel.id = nanoid();
        }
        store.collections[collectionName].baseController.set(newModel);
    };

    return {collection, model, set, controller: baseController, changed, name, fields: requestedFields, id: currentId};
};
