import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useOutlet,
} from "react-router-dom";
import { useContext, useReducer, useState } from "react";

import Footer from "./Footer";
import ErrorContainer from "./EventContainer";
import { SessionContext } from "contexts/SessionContext";
import { getSessionData } from "util/auth";
import {
  EventContext,
  eventReducer
} from "contexts/EventContext";

import OsuLogo from "../assets/images/osu.png";

import "assets/css/main.css";
import PopupContainer from "./PopupContainer";
import { PopupContext, PopupState } from "contexts/PopupContext";
import { AnimatePresence } from "framer-motion";
import React from "react";
import {
  PageTransitionContext,
  PageTransitionContextType,
} from "contexts/PageTransitionContext";

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
  const [errors, dispatchEventMsg] = useReducer(eventReducer, []);
  const [popup, setPopup] = useState<PopupState>(null);
  const { transitioning } = useContext(
    PageTransitionContext
  ) as PageTransitionContextType;

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
            <AnimatedOutlet />
          </SessionContext.Provider>
        </PopupContext.Provider>
      </EventContext.Provider>

      <Footer />
    </>
  );
}
