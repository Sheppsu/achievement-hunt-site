import { Link, NavLink, useLocation, useOutlet } from "react-router-dom";
import { useContext, useReducer, useState } from "react";

import Footer from "./Footer";
import EventContainer from "./events/EventContainer.tsx";
import { SessionContext } from "contexts/SessionContext";
import { getSessionData } from "util/auth";
import { EventContext, eventReducer } from "contexts/EventContext";

import OsuLogo from "../assets/images/osu.png";

import "assets/css/main.css";
import PopupContainer from "./popups/PopupContainer.tsx";
import { PopupContext, PopupState } from "contexts/PopupContext";
import { AnimatePresence } from "framer-motion";
import React from "react";
import { IoIosNotifications } from "react-icons/io";
import NotificationContainer from "components/notifications/NotificationContainer.tsx";

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
  const [popup, setPopup] = useState<PopupState>(null);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  return (
    <>
      <EventContext.Provider value={dispatchEventMsg}>
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

        <NotificationContainer
          eventsState={eventsState}
          display={showNotifications}
        />

        <PopupContext.Provider value={{ popup, setPopup }}>
          <PopupContainer />
          <EventContainer events={eventsState.events} />
          <SessionContext.Provider value={getSessionData()}>
            <AnimatedOutlet />
          </SessionContext.Provider>
        </PopupContext.Provider>
      </EventContext.Provider>

      <Footer />
    </>
  );
}
