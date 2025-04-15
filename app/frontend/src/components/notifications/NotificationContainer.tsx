import cn from "classnames";
import NotificationEventEntry from "components/notifications/NotificationEventEntry.tsx";
import { EventContext, EventState } from "contexts/EventContext.ts";
import { motion } from "motion/react";
import { useContext } from "react";

export default function NotificationContainer({
  eventsState,
  display,
}: {
  eventsState: EventState;
  display: boolean;
}) {
  const dispatchEventMsg = useContext(EventContext);

  return (
    <motion.div
      className={cn("notification-container", { hide: !display })}
      id="notification-popup"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.1 }}
      layout
    >
      <div className="notifications-header">
        <p>Notifications</p>
        <button
          className="notifications-clear-all-button"
          onClick={() => dispatchEventMsg({ type: "clearall" })}
        >
          Clear All
        </button>
      </div>
      <div className="notification-scroll-container">
        {eventsState.pastEvents
          .map((event, i) => <NotificationEventEntry key={i} event={event} />)
          .reverse()}
      </div>
    </motion.div>
  );
}
