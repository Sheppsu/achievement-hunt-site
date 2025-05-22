import { Event, EventContext } from "contexts/EventContext.ts";
import { motion } from "motion/react";
import { useContext } from "react";
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
      <div className="events__entry__container">
        <p className="events__entry__container__text">{event.msg}</p>
      </div>
      <div
        className="events__entry__dismiss-btn"
        onClick={() => dispatchEventMsg({ type: "removed", id: event.id })}
      >
        <IoClose size={20} />
      </div>
    </motion.div>
  );
}
