import { Link, Outlet } from "react-router-dom";
import { useContext, useReducer, useState } from "react";

import UpArrow from "./UpArrow";
import DownArrow from "./DownArrow";
import Backdrop from "./Backdrop";
import Footer from "./Footer";
import ErrorContainer from "./EventContainer";
import { SessionContext } from "contexts/SessionContext";
import {
  EventContext,
  EventState,
  EventStateType,
} from "contexts/EventContext";

import osuLogo from "assets/images/osu.png";
import "assets/css/main.css";

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
  const [useUpArrow, setUseUpArrow] = useState(false);
  const [errors, dispatchEventMsg] = useReducer(errorReducer, []);

  const arrow = (useUpArrow ? UpArrow : DownArrow)("mobile-header-arrow");
  const backdrop = Backdrop(useUpArrow, setUseUpArrow);

  function onClick() {
    setUseUpArrow(!useUpArrow);
  }

  return (
    <>
      <div className="header prevent-select">
        <Link to="/" className="header-link">
          <div className="header-link-container">
            <p className="header-title">CTA</p>
          </div>
        </Link>
        <Link to="/achievements" className="header-link">
          <div className="header-link-container">
            <p className="header-text">CTA</p>
          </div>
        </Link>
        <div style={{ flexGrow: 1 }}></div>
        <div>
          {session.isAuthenticated ? (
            /*<Link to="/dashboard">*/
            <div className="login-box user-box">
              <img
                src={session.user?.avatar}
                alt="avatar"
                className="login-pic"
              />
              <p className="login-text">{session.user?.username}</p>
            </div>
          ) : (
            /*</Link>*/
            <Link to={session.authUrl}>
              <div className="login-box shadow">
                <img src={osuLogo} alt="osu logo" className="login-pic" />
                <p className="login-text">Log In</p>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile header */}
      <div className="mobile-header-container">
        <div className="mobile-header header" onClick={onClick}>
          <Link className="header-link" to="/">
            <div className="header-link-container">
              <h1 className="header-title">CTA</h1>
            </div>
          </Link>
          {arrow}
        </div>
        <div
          className="mobile-header-dropdown header-dropdown"
          style={{ display: useUpArrow ? "flex" : "none" }}
        >
          <div className="dropdown-user-container">
            {session.isAuthenticated ? (
              <div className="login-box user-box">
                <img
                  src={session.user?.avatar}
                  alt="avatar"
                  className="login-pic"
                />
                <p className="login-text">{session.user?.username}</p>
              </div>
            ) : (
              <Link to={session.authUrl}>
                <div className="login-box shadow">
                  <img src={osuLogo} alt="osu logo" className="login-pic" />
                  <p className="login-text">Log In</p>
                </div>
              </Link>
            )}
          </div>
          <Link to="/achievements">
            <div className="header-dropdown-item" onClick={onClick}>
              <p className="header-text dropdown">CTA</p>
            </div>
          </Link>
        </div>
      </div>

      {backdrop}

      <EventContext.Provider value={dispatchEventMsg}>
        <ErrorContainer events={errors} />
        <Outlet />
      </EventContext.Provider>

      <Footer />
    </>
  );
}
