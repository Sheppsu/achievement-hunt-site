import { AchievementType } from "api/types/AchievementType.ts";
import classNames from "classnames";
import Button from "components/inputs/Button.tsx";
import TextInput from "components/inputs/TextInput.tsx";
import { StateDispatch } from "contexts/StateContext.ts";
import { useState } from "react";
import { AppState } from "types/AppStateType.ts";
import { parseTags, sortedConcat, toTitleCase } from "util/helperFunctions.ts";

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
  rows: {
    mode: NavRowItems;
    tags: NavRowItems;
    sort: SortedNavRowItems;
  };
  isStaff: boolean;
};

export function getDefaultNav(
  achievements: AchievementType[],
  isStaff: boolean = false,
): NavItems {
  let tags: string[] = [];
  for (const achievement of achievements) {
    for (const tag of parseTags(achievement.tags, false)) {
      tags = sortedConcat(tags, tag, (a, b) => a.localeCompare(b));
    }
  }

  const sortItems = isStaff
    ? [
        { label: "last active", active: true },
        { label: "creation time", active: false },
        { label: "votes", active: false },
      ]
    : [
        { label: "completions", active: true },
        { label: "player", active: false },
        { label: "date completed", active: false },
        { label: "release", active: false },
      ];

  let modes = [
    { label: "any", active: false },
    { label: "standard", active: false },
    { label: "taiko", active: false },
    { label: "mania", active: false },
    { label: "catch", active: false },
  ];

  return {
    rows: {
      mode: {
        items: modes,
      },
      tags: { items: tags.map((t) => ({ label: t, active: false })) },
      sort: {
        items: sortItems,
        sort: "desc",
      },
    },
    isStaff,
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
  onItemClick: (label: keyof NavItems["rows"], itemLabel: string) => void;
  onLabelClick: (label: keyof NavItems["rows"]) => void;
}) {
  const isSorted = sort !== undefined;

  let labelText = toTitleCase(label);
  if (isSorted) labelText += sort === "desc" ? " ↓" : " ↑";

  return (
    <div className="achievement-nav-bar__row prevent-select" key={label}>
      <p
        className={classNames("achievement-nav-bar__row__label", {
          "sort-type": isSorted,
        })}
        onClick={
          isSorted
            ? () => onLabelClick(label as keyof NavItems["rows"])
            : undefined
        }
      >
        {labelText}
      </p>
      <div className="achievement-nav-bar__row__options">
        {children.map((item) => (
          <p
            key={item.label}
            className={
              "achievement-nav-bar__row__options__item" +
              (item.active ? " active" : "")
            }
            onClick={() =>
              onItemClick(label as keyof NavItems["rows"], item.label)
            }
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
  dispatchState,
  achievements,
  isStaff,
}: {
  state: AppState | null;
  dispatchState: StateDispatch;
  achievements: AchievementType[] | undefined;
  isStaff: boolean;
}) {
  const [searchField, setSearchField] = useState<string>("");

  function onReset() {
    if (!achievements) return;

    dispatchState({
      id: 5,
      achievementsFilter: getDefaultNav(achievements, isStaff),
    });
    dispatchState({ id: 6, achievementsSearchFilter: "" });
    setSearchField("");
  }

  function onItemClick(label: keyof NavItems["rows"], itemLabel: string) {
    if (state === null || state.achievementsFilter === null) return;

    dispatchState({
      id: 10,
      label: label,
      item: itemLabel,
      multiSelect: label !== "sort",
    });
  }

  function onLabelClick(label: keyof NavItems["rows"]) {
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
  }

  function onShowMyAchievements(e: React.ChangeEvent<HTMLInputElement>) {
    dispatchState({
      id: 12,
      hideMyAchievements: e.target.checked,
    });
  }

  // reset navigator when switching pages (staff vs achievements)
  if (
    state !== null &&
    state.achievementsFilter !== null &&
    state.achievementsFilter.isStaff !== isStaff
  ) {
    onReset();
  }

  return (
    <div className="achievement-nav-bar">
      {state === null ? (
        <div>Loading...</div>
      ) : (
        <>
          <div className="achievement-nav-bar__row--input">
            <TextInput
              placeholder="Search"
              value={searchField}
              onChange={onSearchChange}
            />
            <div
              className={classNames("achievement-nav-bar__row--input__group", {
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
              className={classNames("achievement-nav-bar__row--input__group", {
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
          {Object.entries(
            (state.achievementsFilter?.rows ?? {}) as NavItems["rows"],
          ).map(([label, children]) => (
            <AchievementNavigationBarRow
              label={label}
              sort={"sort" in children ? children.sort : undefined}
              children={children.items}
              onItemClick={onItemClick}
              onLabelClick={onLabelClick}
            />
          ))}
          <Button onClick={() => onReset()}>Reset to Default</Button>
        </>
      )}
    </div>
  );
}
