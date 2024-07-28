import "assets/css/main.css";
import ErrorEntry from "./EventEntry";
import { useEffect, useState } from "react";
import { EventState } from "contexts/EventContext";
import { AnimatePresence, motion } from "framer-motion";

export default function EventContainer({ events }: { events: EventState[] }) {
  const [time, setTime] = useState(Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => setTime(Date.now()), 10);
    return () => clearInterval(intervalId);
  });

  return (
    <div className="event-container">
      <AnimatePresence>
        {events.map((event) => (
          <ErrorEntry key={event.id} event={event} time={time} />
        ))}
      </AnimatePresence>
    </div>
  );
}
