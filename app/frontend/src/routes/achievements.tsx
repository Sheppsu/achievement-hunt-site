import { useGetAchievements, useGetTeams } from "api/query";
import AchievementContainer from "components/achievements/AchievementContainer";
import AchievementProgress, {
  defaultState,
  StateDispatch,
  WebsocketState,
  wsReducer,
} from "components/achievements/AchievementProgress";

import "assets/css/achievements.css";
import { useContext, useEffect, useReducer, useState } from "react";
import { SessionContext } from "contexts/SessionContext";
import { Helmet } from "react-helmet";
import {
  AchievementTeamExtendedType,
  AchievementTeamType,
} from "api/types/AchievementTeamType";
import AnimatedPage from "components/AnimatedPage";
import { AchievementExtendedType } from "api/types/AchievementType";

const EVENT_START = 1724976000000;
export const EVENT_END = 1724976000000;

function getMyTeam(
  userId: number | undefined,
  teams?: Array<AchievementTeamExtendedType | AchievementTeamType>
): AchievementTeamExtendedType | null {
  if (userId === undefined) {
    return null;
  }

  if (teams !== undefined)
    for (const team of teams) {
      if ("players" in team) {
        for (const player of team.players) {
          if (player.user.id === userId) {
            return team as AchievementTeamExtendedType;
          }
        }
      }
    }

  return null;
}

function getTimeStr(delta: number) {
  const days = Math.floor((delta / (1000 * 60 * 60 * 24)) % 60);
  const hours = Math.floor((delta / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((delta / (1000 * 60)) % 60);
  const seconds = Math.floor((delta / 1000) % 60);
  const timeString = [days, hours, minutes, seconds]
    .map((n) => (n < 10 ? "0" + n : "" + n))
    .join(":");
  return timeString;
}

function HiddenAchievementCompletionPage({
  time,
  setTime
}: {
  time: number,
  setTime: React.Dispatch<React.SetStateAction<number>>
}) {
  const delta = EVENT_START - time;
  const timeString = getTimeStr(delta);

  useEffect(() => {
    const intervalId = setInterval(() => setTime(Date.now()), 1000);
    return () => clearInterval(intervalId);
  });

  return (
    <div style={{ margin: "auto", textAlign: "center", marginTop: "20px" }}>
      <Helmet>
        <title>CTA - Starts in {timeString}</title>
      </Helmet>
      <h1 style={{ fontSize: "1em" }}>Starts in {timeString}</h1>
    </div>
  );
}

function LimitedAchievementCompletionPage() {
  return (
    <AchievementContainer />
  );
}

function FullAchievementCompletionPage({
  team,
  state,
  dispatchState,
}: {
  team: AchievementTeamExtendedType | null;
  state: WebsocketState;
  dispatchState: StateDispatch;
}) {
  return (
    <>
      <AchievementContainer />
      <div className="progress-container">
        <AchievementProgress state={state} dispatchState={dispatchState} team={team} />
      </div>
    </>
  );
}

type NavItem = {
  label: string;
  active: boolean;
};

type NavItems = {
  mode: NavItem[];
  categories: NavItem[];
  tags: NavItem[];
};

function getDefaultNav(achievements: AchievementExtendedType[]): NavItems {
  const categories: string[] = [];
  const tags: string[] = [];
  for (const achievement of achievements) {
    if (!categories.includes(achievement.category)) {
      categories.push(achievement.category)
    }

    for (const tag of achievement.tags.split(",")) {
      if (!tags.includes(tag)) {
        tags.push(tag);
      }
    }
  }

  return {
    mode: [
      {label: "standard", active: true},
      {label: "taiko", active: false},
      {label: "mania", active: false},
      {label: "catch", active: false},
    ],
    categories: categories.map((c) => ({label: c, active: true})),
    tags: tags.map((t) => ({label: t, active: true}))
  };
}

function AchievementNavigationBar({
  state,
  items,
  dispatchState,
  setNavItems
}: {
  state: WebsocketState | null
  items: NavItems,
  dispatchState: StateDispatch,
  setNavItems: React.Dispatch<React.SetStateAction<NavItems | undefined>>
}) {
  function onItemClick(category: keyof NavItems, label: string) {
    const newItems = {...items};

    if (category === "mode") {
      if (state === null) return;

      for (const child of newItems.mode) {
        child.active = child.label === label;
      }

      dispatchState({id: 4, mode: ["standard", "taiko", "catch", "mania"].indexOf(label)});
    } else {
      for (const child of newItems[category]) {
        if (child.label === label) {
          child.active = !child.active;
        }
      }
    }

    setNavItems(newItems);
  }

  return (
    <div className="achievement-nav-bar">
      <input type="text" placeholder="Search" />
      {Object.entries(items).map(([category, children]) =>
        <div className="achievement-nav-bar-row">
          <p className="achievement-nav-bar-label">{category}</p>
          {children.map((item) => 
            <p 
              className={"achievement-nav-bar-item" + (item.active ? " active":"")}
              onClick={() => onItemClick(category as keyof NavItems, item.label)}
            >
              {item.label}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function AchievementCompletionPage() {
  const session = useContext(SessionContext);

  useGetAchievements(false);
  const { data: teams } = useGetTeams();
  const team = getMyTeam(session.user?.id, teams);

  const [time, setTime] = useState<number>(Date.now());
  const [state, dispatchState] = useReducer(wsReducer, null, defaultState);
  const [navItems, setNavItems] = useState<NavItems | undefined>(undefined);

  if (time < EVENT_START && !session.debug) {
    return <HiddenAchievementCompletionPage time={time} setTime={setTime} />;
  }

  const { data: achievements } = useGetAchievements(true);
  if (navItems === undefined && achievements !== undefined) {
    setNavItems(getDefaultNav(achievements));
  }

  return (
    <AnimatedPage>
      <Helmet>
        <title>CTA - Completions</title>
      </Helmet>

      <div className="page-container">
        <div style={{ margin: "auto", textAlign: "center", marginTop: "20px" }}>
          <h1 style={{ fontSize: "3em" }}>
            {time < EVENT_END
              ? `Ends in: ${getTimeStr(EVENT_END - time)}`
              : "Event ended"}
          </h1>
        </div>
        
        {
          navItems !== undefined ? 
          <AchievementNavigationBar 
            state={state} items={navItems} setNavItems={setNavItems} dispatchState={dispatchState} 
          /> : ""
        }

        <div className="achievement-content-container">
          {team !== null ? (
            <FullAchievementCompletionPage
              state={state}
              dispatchState={dispatchState}
              team={team}
            />
          ) : (
            <LimitedAchievementCompletionPage />
          )}
        </div>
      </div>
    </AnimatedPage>
  );
}
