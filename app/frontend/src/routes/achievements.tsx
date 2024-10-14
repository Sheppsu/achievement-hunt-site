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
import { AchievementTeamExtendedType } from "api/types/AchievementTeamType";
import AnimatedPage from "components/AnimatedPage";
import { AchievementExtendedType } from "api/types/AchievementType";
import { getMyTeam, toTitleCase } from "util/helperFunctions";
import { AnimationScope, useAnimate } from "framer-motion";
import Button from "components/Button";

function getTimeStr(delta: number) {
  const days = Math.floor((delta / (1000 * 60 * 60 * 24)) % 60);
  const hours = Math.floor((delta / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((delta / (1000 * 60)) % 60);
  const seconds = Math.floor((delta / 1000) % 60);
  return [days, hours, minutes, seconds]
    .map((n) => (n < 10 ? "0" + n : "" + n))
    .join(":");
}

function HiddenAchievementCompletionPage({
  time,
  setTime,
  eventStart,
}: {
  time: number;
  setTime: React.Dispatch<React.SetStateAction<number>>;
  eventStart: number;
}) {
  const delta = eventStart - time;
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

function LimitedAchievementCompletionPage({
  state,
  scope,
}: {
  state: WebsocketState;
  scope: AnimationScope;
}) {
  return <AchievementContainer scope={scope} state={state} />;
}

function FullAchievementCompletionPage({
  team,
  state,
  scope,
  dispatchState,
}: {
  team: AchievementTeamExtendedType | null;
  state: WebsocketState;
  scope: AnimationScope;
  dispatchState: StateDispatch;
}) {
  return (
    <>
      <AchievementContainer scope={scope} state={state} />
      <div className="progress-container">
        <AchievementProgress
          state={state}
          dispatchState={dispatchState}
          team={team}
        />
      </div>
    </>
  );
}

export type NavItem = {
  label: string;
  active: boolean;
};

export type NavItems = {
  mode: NavItem[];
  categories: NavItem[];
  tags: NavItem[];
};

function getDefaultNav(achievements: AchievementExtendedType[]): NavItems {
  const categories: string[] = [];
  const tags: string[] = [];
  for (const achievement of achievements) {
    if (!categories.includes(achievement.category)) {
      categories.push(achievement.category);
    }

    for (const tag of achievement.tags.split(",")) {
      if (!tags.includes(tag)) {
        tags.push(tag);
      }
    }
  }

  return {
    mode: [
      { label: "standard", active: true },
      { label: "taiko", active: false },
      { label: "mania", active: false },
      { label: "catch", active: false },
    ],
    categories: categories.map((c) => ({ label: c, active: true })),
    tags: tags.map((t) => ({ label: t, active: true })),
  };
}

function AchievementNavigationBar({
  state,
  animate,
  dispatchState,
  achievements,
}: {
  state: WebsocketState | null;
  animate: any; // i have no clue how to put the type for this
  dispatchState: StateDispatch;
  achievements: AchievementExtendedType[] | undefined;
}) {
  const [animating, setAnimating] = useState(false);
  const [searchField, setSearchField] = useState<string>("");

  useEffect(() => {
    if (animating) {
      (async () => {
        await animate("div", { y: 10, opacity: 0 }, { duration: 0.2 });
        await animate("div", { y: 0, opacity: 100 }, { duration: 0.2 });
      })();

      setAnimating(false);
    }
  }, [animating]);

  function onReset() {
    if (!achievements) return;

    setAnimating(true);
    setTimeout(() => {
      dispatchState({ id: 5, achievementsFilter: getDefaultNav(achievements) });
      dispatchState({ id: 6, achievementsSearchFilter: "" });
      setSearchField("");
    }, 225);
  }

  function onItemClick(category: keyof NavItems, label: string) {
    if (state === null || state.achievementsFilter === null) return;

    const newItems = { ...state.achievementsFilter };

    if (category === "mode") {
      for (const child of newItems.mode) {
        child.active = child.label === label;
      }

      dispatchState({
        id: 4,
        mode: ["standard", "taiko", "catch", "mania"].indexOf(label),
      });
    } else {
      for (const child of newItems[category]) {
        if (child.label === label) {
          child.active = !child.active;
        }
      }
    }

    setAnimating(true);
    setTimeout(() => {
      dispatchState({ id: 5, achievementsFilter: newItems });
    }, 225);
  }

  return (
    <div className="achievement-nav-bar">
      {state === null ? (
        <div>Loading...</div>
      ) : (
        <>
          <div className="achievement-nav-bar-input-row">
            <input
              type="text"
              placeholder="Search"
              name="input"
              autoComplete="off"
              value={searchField}
              onChange={(e) => {
                setSearchField(e.target.value);
                dispatchState({
                  id: 6,
                  achievementsSearchFilter: e.target.value,
                });
              }}
            />
            <div className="achievement-nav-bar-checkbox">
              <input
                id="hide-completed"
                type="checkbox"
                style={{ width: 18 }}
                onChange={(e) => {
                  setAnimating(true);
                  setTimeout(() => {
                    dispatchState({
                      id: 7,
                      hideCompletedAchievements: e.target.checked,
                    });
                  }, 225);
                }}
              />
              <p>Hide completed achievements</p>
            </div>
          </div>
          {Object.entries(state.achievementsFilter ?? {}).map(
            ([category, children]) => (
              <div className="achievement-nav-bar-row" key={category}>
                <p className="achievement-nav-bar-label">
                  {toTitleCase(category)}
                </p>
                <div className="achievement-nav-bar-children">
                  {children.map((item) => (
                    <p
                      key={item.label}
                      className={
                        "achievement-nav-bar-item" +
                        (item.active ? " active" : "")
                      }
                      onClick={() =>
                        onItemClick(category as keyof NavItems, item.label)
                      }
                    >
                      {toTitleCase(item.label)}
                    </p>
                  ))}
                </div>
              </div>
            ),
          )}
          <Button onClick={() => onReset()}>Reset to Default</Button>
        </>
      )}
    </div>
  );
}

export default function AchievementCompletionPage() {
  const session = useContext(SessionContext);
  const eventStart = session.eventStart;
  const eventEnd = session.eventEnd;

  useGetAchievements(false);
  const { data: teams } = useGetTeams();
  const team = getMyTeam(session.user?.id, teams);

  const [time, setTime] = useState<number>(Date.now());
  const [state, dispatchState] = useReducer(wsReducer, null, defaultState);
  const [scope, animate] = useAnimate();

  if (time < eventStart && !session.debug) {
    return (
      <HiddenAchievementCompletionPage
        time={time}
        setTime={setTime}
        eventStart={eventStart}
      />
    );
  }

  const { data: achievements } = useGetAchievements(true);
  if (state.achievementsFilter === null && achievements !== undefined) {
    dispatchState({ id: 5, achievementsFilter: getDefaultNav(achievements) });
  }

  useEffect(() => {
    const intervalId = setInterval(() => setTime(Date.now()), 1000);
    return () => clearInterval(intervalId);
  });

  return (
    <AnimatedPage>
      <Helmet>
        <title>CTA - Completions</title>
      </Helmet>

      <div className="page-container">
        <div style={{ margin: "auto", textAlign: "center", marginTop: "20px" }}>
          <h1 style={{ fontSize: "3em" }}>
            {time < eventEnd
              ? `Ends in: ${getTimeStr(eventEnd - time)}`
              : "Event ended"}
          </h1>
        </div>

        <AchievementNavigationBar
          state={state}
          animate={animate}
          dispatchState={dispatchState}
          achievements={achievements}
        />

        <div className="achievement-content-container">
          {team !== null ? (
            <FullAchievementCompletionPage
              scope={scope}
              state={state}
              dispatchState={dispatchState}
              team={team}
            />
          ) : (
            <LimitedAchievementCompletionPage state={state} scope={scope} />
          )}
        </div>
      </div>
    </AnimatedPage>
  );
}
