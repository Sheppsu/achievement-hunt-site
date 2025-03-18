import { WebsocketState } from "types/WebsocketStateType.ts";
import { StateDispatch } from "contexts/StateContext.ts";
import {
  AchievementExtendedType,
  AchievementType,
} from "api/types/AchievementType.ts";
import { useEffect, useState } from "react";
import { parseTags, toTitleCase } from "util/helperFunctions.ts";
import Button from "components/inputs/Button.tsx";
import classNames from "classnames";

export type NavItem = {
  label: string;
  active: boolean;
};

export type NavRowItems = {
  items: NavItem[];
};

export type SortedNavRowItems = {
  sort: "desc" | "asc";
} & NavRowItems;

export type NavItems = {
  mode: NavRowItems;
  tags: NavRowItems;
  sort: SortedNavRowItems;
};

export function getDefaultNav(
  achievements: AchievementType[],
  isStaff: boolean = false,
): NavItems {
  const tags: string[] = [];
  for (const achievement of achievements) {
    for (const tag of parseTags(achievement.tags, false)) {
      if (!tags.includes(tag)) {
        tags.push(tag);
      }
    }
  }

  const sortItems = isStaff
    ? [
        { label: "last edited", active: true },
        { label: "creation time", active: false },
        { label: "votes", active: false },
      ]
    : [
        { label: "completions", active: true },
        { label: "player", active: false },
        { label: "date completed", active: false },
        { label: "batch", active: false },
      ];

  return {
    mode: {
      items: [
        { label: "standard", active: true },
        { label: "taiko", active: false },
        { label: "mania", active: false },
        { label: "catch", active: false },
      ],
    },
    tags: { items: tags.map((t) => ({ label: t, active: false })) },
    sort: {
      items: sortItems,
      sort: "desc",
    },
  };
}

function AchievementNavigationBarRow({
  label,
  sort,
  children,
  onItemClick,
  onLabelClick,
}: {
  label: string;
  sort: string | undefined;
  children: NavItem[];
  onItemClick: (label: keyof NavItems, itemLabel: string) => void;
  onLabelClick: (label: keyof NavItems) => void;
}) {
  const isSorted = sort !== undefined;

  let labelText = toTitleCase(label);
  if (isSorted) labelText += sort === "desc" ? " ↓" : " ↑";

  return (
    <div className="achievement-nav-bar-row prevent-select" key={label}>
      <p
        className={classNames("achievement-nav-bar-label", {
          "sort-type": isSorted,
        })}
        onClick={
          isSorted ? () => onLabelClick(label as keyof NavItems) : undefined
        }
      >
        {labelText}
      </p>
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
  isStaff,
}: {
  state: WebsocketState | null;
  animate: Function;
  dispatchState: StateDispatch;
  achievements: AchievementType[] | undefined;
  isStaff: boolean;
}) {
  const [animating, setAnimating] = useState(false);
  const [searchField, setSearchField] = useState<string>("");

  async function doAnimation() {
    if (animating) return;

    setAnimating(true);

    await animate("div", { y: 10, opacity: 0 }, { duration: 0.2 });
    await animate("div", { y: 0, opacity: 100 }, { duration: 0.2 });

    setAnimating(false);
  }

  function onReset() {
    if (!achievements) return;

    dispatchState({
      id: 5,
      achievementsFilter: getDefaultNav(achievements, isStaff),
    });
    dispatchState({ id: 6, achievementsSearchFilter: "" });
    setSearchField("");

    doAnimation();
  }

  function onItemClick(label: keyof NavItems, itemLabel: string) {
    if (state === null || state.achievementsFilter === null) return;

    dispatchState({
      id: 10,
      label: label,
      item: itemLabel,
      multiSelect: label !== "mode" && label !== "sort",
    });

    if (label === "mode")
      dispatchState({
        id: 4,
        mode: ["standard", "taiko", "catch", "mania"].indexOf(itemLabel),
      });

    doAnimation();
  }

  function onLabelClick(label: keyof NavItems) {
    dispatchState({ id: 11, label });
  }

  function onSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchField(e.target.value);
    dispatchState({
      id: 6,
      achievementsSearchFilter: e.target.value,
    });
  }

  function onHideCompletedChange(e: React.ChangeEvent<HTMLInputElement>) {
    dispatchState({
      id: 7,
      hideCompletedAchievements: e.target.checked,
    });

    doAnimation();
  }

  function onShowMyAchievements(e: React.ChangeEvent<HTMLInputElement>) {
    dispatchState({
      id: 12,
      hideMyAchievements: e.target.checked,
    });

    doAnimation();
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
            <div
              className={classNames("achievement-nav-bar-input-group", {
                hide: isStaff,
              })}
            >
              <input
                id="hide-completed"
                type="checkbox"
                style={{ width: 18 }}
                onChange={onHideCompletedChange}
                checked={state.hideCompletedAchievements}
              />
              <p>Hide completed achievements</p>
            </div>
            <div
              className={classNames("achievement-nav-bar-input-group", {
                hide: !isStaff,
              })}
            >
              <input
                id="hide-my-achievements"
                type="checkbox"
                style={{ width: 18 }}
                onChange={onShowMyAchievements}
                checked={state.showMyAchievements}
              />
              <p>Show my achievements</p>
            </div>
          </div>
          {Object.entries((state.achievementsFilter ?? {}) as NavItems).map(
            ([label, children]) => (
              <AchievementNavigationBarRow
                label={label}
                sort={"sort" in children ? children.sort : undefined}
                children={children.items}
                onItemClick={onItemClick}
                onLabelClick={onLabelClick}
              />
            ),
          )}
          <Button onClick={() => onReset()}>Reset to Default</Button>
        </>
      )}
    </div>
  );
}
