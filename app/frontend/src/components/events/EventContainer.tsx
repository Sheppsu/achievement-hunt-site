import "assets/css/main.css";
import { Event } from "contexts/EventContext.ts";
import { AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import EventEntry from "./EventEntry.tsx";

export default function EventContainer({ events }: { events: Event[] }) {
  const [time, setTime] = useState(Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => setTime(Date.now()), 10);
    return () => clearInterval(intervalId);
  });

  return (
    <div className="event-container">
      <AnimatePresence>
        {events.map((event) => (
          <EventEntry key={event.id} event={event} time={time} />
        ))}
      </AnimatePresence>
    </div>
  );
}
