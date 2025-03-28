import { createContext } from "react";
import { Collection } from "./types";


const StoreContext = createContext(new Map<string, Collection<any>>());
export default StoreContext;
