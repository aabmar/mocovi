import { useContext, useMemo } from "react";
import MocoviContext from "./MocoviContext";
import logger from "./logger";
import { BaseController, Model, Store } from "./types";
import createUseCom from "./useCom";

const { err } = logger("useController");

/**
 * Hook for accessing a store's controller without subscribing to state changes
 * Returns the BaseController and useCom hook for the specified store
 * This hook does not cause re-renders when the store data changes
 */
function useController<Data extends Model>(storeId: string): {
    controller: BaseController<Data>;
    useCom: ReturnType<typeof createUseCom<Data>>;
} {

    const mocovi = useContext(MocoviContext);

    // Get the store
    const store = mocovi.getStore(storeId) as Store<Data> | undefined;

    if (!store) {
        err(`Store with ID '${storeId}' not found`);
        throw new Error(`Store with ID '${storeId}' not found`);
    }

    // Add useCom to the return
    const useCom = useMemo(() => createUseCom<Data>(store), [store]);

    return {
        controller: store.baseController,
        useCom
    };
}

export default useController;
