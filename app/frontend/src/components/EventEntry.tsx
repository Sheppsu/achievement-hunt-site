import { useContext, useEffect } from "react";
import AnimatedPage from "./AnimatedPage";
import { EventContext, EventState } from "contexts/EventContext";
import { motion } from "framer-motion";
import { IoIosWarning, IoMdInformationCircle } from "react-icons/io";
import { IoClose } from "react-icons/io5";

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
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 100 }}
      exit={{ y: 10, opacity: 0 }}
      layout
    >
      <div className={"event-status-icon " + event.type}>
        {event.type === "error" ? (
          <IoIosWarning size={30} />
        ) : (
          <IoMdInformationCircle size={30} />
        )}
      </div>
      <div className="event-text-container">
        <p className="event-text">{event.msg}</p>
        <div
          className={"event-bar " + event.type}
          style={{ width: progress }}
        ></div>
      </div>
      <div className="event-dismiss" onClick={() => (event.expiresAt = time)}>
        <IoClose size={20} />
      </div>
    </motion.div>
  );
}
