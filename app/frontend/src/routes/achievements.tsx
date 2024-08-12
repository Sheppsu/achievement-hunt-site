import { useGetAchievements, useGetTeams } from "api/query";
import AchievementContainer from "components/achievements/AchievementContainer";
import AchievementProgress, {
  defaultState,
  StateDispatch,
  WebsocketState,
  wsReducer,
} from "components/achievements/AchievementProgress";

import "assets/css/achievements.css";
import {
  ChangeEvent,
  FormEvent,
  useContext,
  useEffect,
  useReducer,
  useState,
} from "react";
import { SessionContext } from "contexts/SessionContext";
import { Helmet } from "react-helmet";
import {
  AchievementTeamExtendedType,
  AchievementTeamType,
} from "api/types/AchievementTeamType";
import AnimatedPage from "components/AnimatedPage";
import { AchievementExtendedType } from "api/types/AchievementType";
import { toTitleCase } from "util/helperFunctions";
import { AnimationScope, useAnimate } from "framer-motion";
import Button from "components/Button";

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
  setTime,
}: {
  time: number;
  setTime: React.Dispatch<React.SetStateAction<number>>;
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
    categories: categories.map((c) => ({ label: c, active: false })),
    tags: tags.map((t) => ({ label: t, active: false })),
  };
}

function AchievementNavigationBar({
  state,
  animate,
  dispatchState,
}: {
  state: WebsocketState | null;
  animate: any; // i have no clue how to put the type for this
  dispatchState: StateDispatch;
}) {
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (animating) {
      (async () => {
        await animate("div", { y: 10, opacity: 0 }, { duration: 0.2 });
        await animate("div", { y: 0, opacity: 100 }, { duration: 0.2 });
      })();

      setAnimating(false);
    }
  }, [animating]);

  function onItemClick(category: keyof NavItems, label: string) {
    if (state === null || state?.achievementsFilter === undefined) return;

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
          <input
            type="text"
            placeholder="Search"
            name="input"
            autoComplete="off"
            onChange={(e) =>
              dispatchState({ id: 6, achievementsSearchFilter: e.target.value })
            }
          />
          {Object.entries(state?.achievementsFilter).map(
            ([category, children]) => (
              <div className="achievement-nav-bar-row" key={category}>
                <p className="achievement-nav-bar-label">
                  {toTitleCase(category)}
                </p>
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
            )
          )}
        </>
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
  const [scope, animate] = useAnimate();

  if (time < EVENT_START && !session.debug) {
    return <HiddenAchievementCompletionPage time={time} setTime={setTime} />;
  }

  const { data: achievements } = useGetAchievements(true);
  if (
    state.achievementsFilter.mode[0].label === "default" &&
    achievements !== undefined
  ) {
    dispatchState({ id: 5, achievementsFilter: getDefaultNav(achievements) });
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

        {state.achievementsFilter !== undefined ? (
          <AchievementNavigationBar
            state={state}
            animate={animate}
            dispatchState={dispatchState}
          />
        ) : (
          ""
        )}

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
