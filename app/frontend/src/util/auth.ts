import { Session } from "types/SessionType";

export function getSessionData(): Session {
    return JSON.parse(document.getElementById("data")?.textContent as string);
}