import { useContext, useEffect } from "react";
import AnimatedPage from "./AnimatedPage";
import { EventContext, EventState } from "contexts/EventContext";
import { motion } from "framer-motion";

export default function EventEntry({
  event,
  time,
}: {
  event: EventState;
  time: number;
}) {
  const eventLength = event.expiresAt - event.createdAt;
  const expiresIn = Math.max(event.expiresAt - time, 0);
  const progress = `${(expiresIn / eventLength) * 100}%`;

  const dispatchEventMsg = useContext(EventContext);
  useEffect(() => {
    const timeoutId = setTimeout(
      () => dispatchEventMsg({ type: "expired", id: event.id }),
      expiresIn
    );
    return () => clearTimeout(timeoutId);
  }, [expiresIn, dispatchEventMsg, event]);

  return (
    <motion.div
      className={"prevent-select event-entry " + event.type}
      onClick={() => (event.expiresAt = time)}
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 100 }}
      exit={{ y: 10, opacity: 0 }}
      layout
    >
      <p className="event-text">{event.msg}</p>
      <div
        className={"event-bar " + event.type}
        style={{ width: progress }}
      ></div>
    </motion.div>
  );
}
