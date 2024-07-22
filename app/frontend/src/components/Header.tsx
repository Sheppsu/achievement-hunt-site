import { Link, NavLink, Outlet } from "react-router-dom";
import { useContext, useReducer, useState } from "react";

import Footer from "./Footer";
import ErrorContainer from "./EventContainer";
import { SessionContext } from "contexts/SessionContext";
import { getSessionData } from "util/auth";
import {
  EventContext,
  EventState,
  EventStateType,
} from "contexts/EventContext";

import OsuLogo from "../assets/images/osu.png";

import "assets/css/main.css";
import PopupContainer from "./PopupContainer";
import { PopupContext, PopupState } from "contexts/PopupContext";

function errorReducer(
  events: EventState[],
  { type, msg, id }: { type: EventStateType; msg?: string; id?: number }
) {
  if (type === "expired") {
    for (const [i, event] of events.entries()) {
      if (event.id === id) {
        // TODO: add to some log where it can be accessed by the user to view past events
        return events.slice(0, i).concat(events.slice(i + 1));
      }
    }
    return events;
  }

  const now = Date.now();
  if (id === undefined) {
    id = events.length === 0 ? 1 : events[events.length - 1].id + 1;
  }
  return events.concat([
    {
      id,
      type,
      msg: msg ?? "",
      createdAt: now,
      expiresAt: now + 10000,
    },
  ]);
}

export default function Header() {
  const session = useContext(SessionContext);
  // const [useUpArrow, setUseUpArrow] = useState(false);
  const [errors, dispatchEventMsg] = useReducer(errorReducer, []);
  const [popup, setPopup] = useState<PopupState>(null);

  return (
    <>
      <div className="prevent-select header">
        <Link to="/">
          <h1 className="header-title">CTA</h1>
        </Link>
        <div className="header-buttons-container">
          <NavLink to="/teams" className="header-button-link">
            Teams
          </NavLink>
          <NavLink to="/achievements" className="header-button-link">
            Achievements
          </NavLink>
        </div>
        {session.isAuthenticated ? (
          <img src={session.user?.avatar} alt="avatar" className="login-pic" />
        ) : (
          <div style={{ height: "100%" }}>
            <Link to={session.authUrl}>
              <img src={OsuLogo} alt="osu logo" className="login-pic" />
            </Link>
          </div>
        )}
      </div>
      <EventContext.Provider value={dispatchEventMsg}>
        <PopupContext.Provider value={{ popup, setPopup }}>
          <PopupContainer />
          <ErrorContainer events={errors} />
          <SessionContext.Provider value={getSessionData()}>
            <Outlet />
          </SessionContext.Provider>
        </PopupContext.Provider>
      </EventContext.Provider>

      <Footer />
    </>
  );
}
