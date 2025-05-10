import { useContext, useReducer, useState } from "react";
import { Link, NavLink, useLocation, useOutlet } from "react-router-dom";

import { EventContext, eventReducer } from "contexts/EventContext";
import { SessionContext } from "contexts/SessionContext";
import { getSessionData } from "util/auth";
import Footer from "./Footer";
import EventContainer from "./events/EventContainer.tsx";

import OsuLogo from "../assets/images/osu.png";

import "assets/css/main.css";
import NotificationContainer from "components/notifications/NotificationContainer.tsx";
import { PopupContext, PopupState } from "contexts/PopupContext";
import {
  StateContext,
  StateDispatchContext,
  wsReducer,
} from "contexts/StateContext.ts";
import { AnimatePresence } from "motion/react";
import React from "react";
import { IoIosNotifications } from "react-icons/io";
import { defaultState } from "types/WebsocketStateType.ts";
import PopupContainer from "./popups/PopupContainer.tsx";

function AnimatedOutlet() {
  const location = useLocation();
  const element = useOutlet();

  return (
    <AnimatePresence mode="wait" initial={true}>
      {element && React.cloneElement(element, { key: location.pathname })}
    </AnimatePresence>
  );
}

export default function Header() {
  const session = useContext(SessionContext);
  const [eventsState, dispatchEventMsg] = useReducer(eventReducer, {
    events: [],
    pastEvents: [],
  });
  const [wsState, dispatchWsState] = useReducer(wsReducer, null, defaultState);
  const [popup, setPopup] = useState<PopupState>(null);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  return (
    <>
      <EventContext.Provider value={dispatchEventMsg}>
        <div className="header-container">
          <div className="prevent-select header">
            <div className="header-left-container">
              <Link to="/">
                <h1 className="header-title">CTA2</h1>
              </Link>
              <div className="header-buttons-container">
                <NavLink to="/teams" className="header-button-link">
                  Dashboard
                </NavLink>
                <NavLink to="/achievements" className="header-button-link">
                  Achievements
                </NavLink>
              </div>
            </div>
            <div className="header-login-container">
              <div
                className="header-notification-button-container"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                }}
              >
                <IoIosNotifications size={24} />
              </div>
              {session.isAuthenticated ? (
                <img
                  src={session.user?.avatar}
                  alt="avatar"
                  className="login-pic"
                />
              ) : (
                <div style={{ height: "100%" }}>
                  <Link to={session.authUrl}>
                    <img src={OsuLogo} alt="osu logo" className="login-pic" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        <NotificationContainer
          eventsState={eventsState}
          display={showNotifications}
        />

        <PopupContext.Provider value={{ popup, setPopup }}>
          <PopupContainer />
          <EventContainer events={eventsState.events} />
          <SessionContext.Provider value={getSessionData()}>
            <StateContext.Provider value={wsState}>
              <StateDispatchContext.Provider value={dispatchWsState}>
                <div style={{ marginTop: "35px" }}>
                  <AnimatedOutlet />
                </div>
              </StateDispatchContext.Provider>
            </StateContext.Provider>
          </SessionContext.Provider>
        </PopupContext.Provider>
      </EventContext.Provider>

      <Footer />
    </>
  );
}
