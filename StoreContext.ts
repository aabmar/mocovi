import { createContext } from "react";
import createStore from "./Store";

export const StoreContext = createContext(createStore());
