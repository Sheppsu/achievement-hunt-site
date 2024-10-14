import "assets/css/main.css";
import EventEntry from "./EventEntry.tsx";
import { useEffect, useState } from "react";
import { Event } from "contexts/EventContext.ts";
import { AnimatePresence, motion } from "framer-motion";

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
