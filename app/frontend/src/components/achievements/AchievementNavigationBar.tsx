import { WebsocketState } from "types/WebsocketStateType.ts";
import { StateDispatch } from "contexts/StateContext.ts";
import { AchievementExtendedType } from "api/types/AchievementType.ts";
import { useEffect, useState } from "react";
import { toTitleCase } from "util/helperFunctions.ts";
import Button from "components/Button.tsx";

export type NavItem = {
  label: string;
  active: boolean;
};

export type NavItems = {
  mode: NavItem[];
  categories: NavItem[];
  tags: NavItem[];
  sort: NavItem[];
};

export function getDefaultNav(
  achievements: AchievementExtendedType[],
): NavItems {
  const categories: string[] = [];
  const tags: string[] = [];
  for (const achievement of achievements) {
    if (!categories.includes(achievement.category)) {
      categories.push(achievement.category);
    }

    for (const tag of achievement.tags.split(",")) {
      if (tag === "") continue;
      if (tag.startsWith("mode-")) continue;

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
    sort: [
      { label: "category", active: true },
      { label: "completions", active: false },
      { label: "player", active: false },
      { label: "date completed", active: false },
    ],
  };
}

function AchievementNavigationBarRow({
  label,
  children,
  onItemClick,
}: {
  label: string;
  children: NavItem[];
  onItemClick: (label: keyof NavItems, itemLabel: string) => void;
}) {
  return (
    <div className="achievement-nav-bar-row" key={label}>
      <p className="achievement-nav-bar-label">{toTitleCase(label)}</p>
      <div className="achievement-nav-bar-children">
        {children.map((item) => (
          <p
            key={item.label}
            className={
              "achievement-nav-bar-item" + (item.active ? " active" : "")
            }
            onClick={() => onItemClick(label as keyof NavItems, item.label)}
          >
            {toTitleCase(item.label)}
          </p>
        ))}
      </div>
    </div>
  );
}

export default function AchievementNavigationBar({
  state,
  animate,
  dispatchState,
  achievements,
}: {
  state: WebsocketState | null;
  animate: Function;
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

  function onItemClick(label: keyof NavItems, itemLabel: string) {
    if (state === null || state.achievementsFilter === null) return;

    const newItems = { ...state.achievementsFilter };

    if (label === "mode" || label === "sort") {
      for (const child of newItems[label]) {
        child.active = child.label === itemLabel;
      }

      // tell websocket to submit under this mode now
      if (label === "mode")
        dispatchState({
          id: 4,
          mode: ["standard", "taiko", "catch", "mania"].indexOf(itemLabel),
        });
    } else {
      for (const child of newItems[label]) {
        if (child.label === itemLabel) {
          child.active = !child.active;
        }
      }
    }

    setAnimating(true);
    setTimeout(() => {
      dispatchState({ id: 5, achievementsFilter: newItems });
    }, 225);
  }

  function onSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchField(e.target.value);
    dispatchState({
      id: 6,
      achievementsSearchFilter: e.target.value,
    });
  }

  function onHideCompletedChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAnimating(true);
    setTimeout(() => {
      dispatchState({
        id: 7,
        hideCompletedAchievements: e.target.checked,
      });
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
              onChange={onSearchChange}
            />
            <div className="achievement-nav-bar-input-group">
              <input
                id="hide-completed"
                type="checkbox"
                style={{ width: 18 }}
                onChange={onHideCompletedChange}
              />
              <p>Hide completed achievements</p>
            </div>
          </div>
          {Object.entries((state.achievementsFilter ?? {}) as NavItems).map(
            ([label, children]) => (
              <AchievementNavigationBarRow
                label={label}
                children={children}
                onItemClick={onItemClick}
              />
            ),
          )}
          <Button onClick={() => onReset()}>Reset to Default</Button>
        </>
      )}
    </div>
  );
}
