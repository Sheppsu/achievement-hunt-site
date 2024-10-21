import { createContext } from "react";
import { getSessionData } from "util/auth";

export const SessionContext = createContext(getSessionData());
