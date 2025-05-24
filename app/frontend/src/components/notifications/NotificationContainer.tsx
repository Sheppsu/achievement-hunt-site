import cn from "classnames";
import NotificationEventEntry from "components/notifications/NotificationEventEntry.tsx";
import { EventContext, EventState } from "contexts/EventContext.ts";
import { motion } from "motion/react";
import React, { useContext } from "react";
import { IoIosClose } from "react-icons/io";

export default function NotificationContainer({
  eventsState,
  display,
  setShowNotifications,
}: {
  eventsState: EventState;
  display: boolean;
  setShowNotifications: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const dispatchEventMsg = useContext(EventContext);

  return (
    <motion.div
      className={cn("notifications-popup", { hide: !display })}
      id="notification-popup"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.1 }}
      layout
    >
      <div className="notifications-popup__header">
        <p>Notifications</p>
        <IoIosClose
          className="notifications-popup__header__close-btn"
          size={48}
          onClick={() => setShowNotifications(false)}
        />
      </div>
      <div className="notifications-popup__container">
        {eventsState.pastEvents
          .map((event, i) => <NotificationEventEntry key={i} event={event} />)
          .reverse()}
      </div>
      <button
        className="notifications-popup__header__clear-btn"
        onClick={() => dispatchEventMsg({ type: "clearall" })}
      >
        Clear All
      </button>
    </motion.div>
  );
}
