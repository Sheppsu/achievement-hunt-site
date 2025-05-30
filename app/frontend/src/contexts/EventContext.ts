import { createContext } from "react";
import { Dispatch } from "react";

export type EventType = "error" | "info" | "expired" | "removed" | "clearall";

export type Event = {
  id: number;
  type: EventType;
  msg: string;
  createdAt: number;
  expiresAt: number;
};

export type EventState = {
  events: Event[];
  pastEvents: Event[];
};

export type EventDispatch = Dispatch<{
  type: EventType;
  msg?: string;
  id?: number;
}>;

export const EventContext = createContext((({
  type,
  msg,
  id,
}: {
  type: EventType;
  msg?: string;
  id?: number;
}) => {
  console.log(type, msg, id);
}) as EventDispatch);

export function eventReducer(
  state: EventState,
  { type, msg, id }: { type: EventType; msg?: string; id?: number },
): EventState {
  const events = state.events;
  const pastEvents = state.pastEvents;

  if (type === "removed") {
    for (const [i, event] of pastEvents.entries()) {
      if (event.id === id) {
        return {
          events: events,
          pastEvents: pastEvents.slice(0, i).concat(pastEvents.slice(i + 1)),
        };
      }
    }
  }

  if (type === "expired") {
    for (const [i, event] of events.entries()) {
      if (event.id === id) {
        return {
          events: events.slice(0, i).concat(events.slice(i + 1)),
          pastEvents: [...pastEvents, event],
        };
      }
    }
    return state;
  }

  if (type === "clearall") {
    return {
      events: events,
      pastEvents: [],
    };
  }

  const now = Date.now();
  if (id === undefined) {
    id = events.length === 0 ? 1 : events[events.length - 1].id + 1;
  }
  return {
    events: events.concat([
      {
        id,
        type,
        msg: msg ?? "",
        createdAt: now,
        expiresAt: now + 10000,
      },
    ]),
    pastEvents: pastEvents,
  };
}
