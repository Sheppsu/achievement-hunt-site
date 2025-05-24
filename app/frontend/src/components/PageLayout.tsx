import { useContext, useReducer, useState } from "react";
import { Link, NavLink, useLocation, useOutlet } from "react-router-dom";

import { EventContext, eventReducer, EventState } from "contexts/EventContext";
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
import { AnimatePresence, motion } from "motion/react";
import React from "react";
import {
  IoIosArrowDropdown,
  IoIosArrowDropup,
  IoIosNotifications,
} from "react-icons/io";
import { defaultState } from "types/WebsocketStateType.ts";
import PopupContainer from "./popups/PopupContainer.tsx";
import classNames from "classnames";

function Header({
  mobile,
  setShowNotifications,
}: {
  mobile: boolean;
  setShowNotifications: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const session = useContext(SessionContext);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const path = location.pathname;
  const iterationPath = path.startsWith("/iterations/")
    ? "/iterations/" + path.split("/")[2]
    : "";

  if (mobile)
    return (
      <div className="header mobile">
        <div
          className="prevent-select header__container"
          onClick={() => setDropdownOpen((val) => !val)}
        >
          <div className="header__container__left-box">
            <Link to={iterationPath + "/"}>
              <h1 className="header__container__left-box__title">CTA2</h1>
            </Link>
          </div>
          <div className="header__container__right-box">
            {dropdownOpen ? (
              <IoIosArrowDropup size={32} />
            ) : (
              <IoIosArrowDropdown size={32} />
            )}
          </div>
        </div>
        <div
          className={classNames("header__dropdown", { hide: !dropdownOpen })}
        >
          <div className="header__dropdown__row">
            {session.isAuthenticated ? (
              <img
                src={session.user?.avatar}
                alt="avatar"
                className="header__container__right-box__login-pic"
              />
            ) : (
              <div style={{ height: "100%" }}>
                <Link to={session.authUrl}>
                  <img
                    src={OsuLogo}
                    alt="osu logo"
                    className="header__container__right-box__login-pic"
                  />
                </Link>
              </div>
            )}
            <div
              className="header__container__right-box__notifications"
              onClick={() => {
                setShowNotifications((val) => !val);
              }}
            >
              <IoIosNotifications size={24} />
            </div>
          </div>
          <NavLink to={iterationPath + "/teams"}>Teams</NavLink>
          <NavLink to={iterationPath + "/achievements"}>Achievements</NavLink>
        </div>
      </div>
    );

  return (
    <div className="header">
      <div className="prevent-select header__container">
        <div className="header__container__left-box">
          <Link to={iterationPath + "/"}>
            <h1 className="header__container__left-box__title">CTA2</h1>
          </Link>
          <div className="header__container__left-box__links">
            <NavLink
              to={iterationPath + "/teams"}
              className="header__container__left-box__links__link"
            >
              Dashboard
            </NavLink>
            <NavLink
              to={iterationPath + "/achievements"}
              className="header__container__left-box__links__link"
            >
              Achievements
            </NavLink>
          </div>
        </div>
        <div className="header__container__right-box">
          <div
            className="header__container__right-box__notifications"
            onClick={() => {
              setShowNotifications((val) => !val);
            }}
          >
            <IoIosNotifications size={24} />
          </div>
          {session.isAuthenticated ? (
            <img
              src={session.user?.avatar}
              alt="avatar"
              className="header__container__right-box__login-pic"
            />
          ) : (
            <div style={{ height: "100%" }}>
              <Link to={session.authUrl}>
                <img
                  src={OsuLogo}
                  alt="osu logo"
                  className="header__container__right-box__login-pic"
                />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PageLayout({
  children,
}: {
  children?: React.ReactNode;
}) {
  const [eventsState, dispatchEventMsg] = useReducer(eventReducer, {
    events: [],
    pastEvents: [],
  });
  const [wsState, dispatchWsState] = useReducer(wsReducer, null, defaultState);
  const [popup, setPopup] = useState<PopupState>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  const location = useLocation();
  if (children === undefined) {
    children = useOutlet();
  }

  return (
    <>
      <EventContext.Provider value={dispatchEventMsg}>
        <Header setShowNotifications={setShowNotifications} mobile={false} />
        <Header setShowNotifications={setShowNotifications} mobile={true} />
        <NotificationContainer
          eventsState={eventsState}
          display={showNotifications}
          setShowNotifications={setShowNotifications}
        />

        <PopupContext.Provider value={{ popup, setPopup }}>
          <PopupContainer />
          <EventContainer events={eventsState.events} />
          <SessionContext.Provider value={getSessionData()}>
            <StateContext.Provider value={wsState}>
              <StateDispatchContext.Provider value={dispatchWsState}>
                <AnimatePresence mode="wait">
                  <motion.div
                    id="page-content"
                    key={location.pathname}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {children}
                  </motion.div>
                </AnimatePresence>
              </StateDispatchContext.Provider>
            </StateContext.Provider>
          </SessionContext.Provider>
        </PopupContext.Provider>
      </EventContext.Provider>

      <Footer />
    </>
  );
}
