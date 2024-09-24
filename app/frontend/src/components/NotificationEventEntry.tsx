import { useContext, useEffect } from "react";
import AnimatedPage from "./AnimatedPage";
import { EventContext, Event } from "contexts/EventContext";
import { motion } from "framer-motion";
import { IoIosWarning, IoMdInformationCircle } from "react-icons/io";
import { IoClose } from "react-icons/io5";

export default function NotificationEventEntry({ event }: { event: Event }) {
  const dispatchEventMsg = useContext(EventContext);
  return (
    <motion.div
      className={"prevent-select event-entry " + event.type}
      initial={{ opacity: 0 }}
      animate={{ opacity: 100 }}
      exit={{ opacity: 0 }}
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
      </div>
      <div
        className="event-dismiss"
        onClick={() => dispatchEventMsg({ type: "removed", id: event.id })}
      >
        <IoClose size={20} />
      </div>
    </motion.div>
  );
}
