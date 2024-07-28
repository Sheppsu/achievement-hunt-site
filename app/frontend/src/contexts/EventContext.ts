import { createContext } from "react";
import { Dispatch } from "react";

export type EventStateType = "error" | "info" | "expired";

export type EventState = {
    id: number,
    type: EventStateType,
    msg: string,
    createdAt: number,
    expiresAt: number
};

export type EventDispatch = Dispatch<{type: EventStateType, msg?: string, id?: number}>;

export const EventContext = createContext((({ type, msg, id }: { type: EventStateType; msg?: string, id?: number }) => {console.log(type, msg, id)}) as EventDispatch);

export function eventReducer(
    events: EventState[],
    { type, msg, id }: { type: EventStateType; msg?: string; id?: number }
  ) {
    if (type === "expired") {
      for (const [i, event] of events.entries()) {
        if (event.id === id) {
          // TODO: add to some log where it can be accessed by the user to view past events
          return events.slice(0, i).concat(events.slice(i + 1));
        }
      }
      return events;
    }
  
    const now = Date.now();
    if (id === undefined) {
      id = events.length === 0 ? 1 : events[events.length - 1].id + 1;
    }
    return events.concat([
      {
        id,
        type,
        msg: msg ?? "",
        createdAt: now,
        expiresAt: now + 10000,
      },
    ]);
  }
