import { useCreateAchievement, useGetStaffAchievement } from "api/query.ts";
import Achievement from "components/staff/Achievement.tsx";

import "assets/css/staff.css";
import { useAuthEnsurer } from "util/auth.ts";
import Button from "components/inputs/Button.tsx";
import TextInput from "components/inputs/TextInput.tsx";
import TextArea from "components/inputs/TextArea.tsx";
import { useState } from "react";
import classNames from "classnames";
import AchievementCreation from "components/staff/AchievementCreation.tsx";
import AchievementNavigationBar, {
  getDefaultNav,
} from "components/achievements/AchievementNavigationBar.tsx";
import {
  useDispatchStateContext,
  useStateContext,
} from "contexts/StateContext.ts";
import { useAnimate } from "framer-motion";
import { getSortedAchievements } from "util/achievementSorting.ts";

export default function Staff() {
  useAuthEnsurer().ensureStaff();

  const { data: achievements, isLoading } = useGetStaffAchievement();
  const state = useStateContext();
  const dispatchState = useDispatchStateContext();
  const [scope, animate] = useAnimate();

  const [creationOpen, setCreationOpen] = useState(false);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (achievements === undefined) {
    return <div>Failed to load achievements</div>;
  }

  if (state.achievementsFilter === null) {
    dispatchState({
      id: 5,
      achievementsFilter: getDefaultNav(achievements, true),
    });
    return <div>Loading...</div>;
  }

  const onOpenCreation = () => {
    setCreationOpen(true);
  };

  const onCancelCreation = () => {
    setCreationOpen(false);
  };

  const sortedAchievements = getSortedAchievements(
    achievements,
    state.achievementsFilter,
    state.achievementsSearchFilter,
    null,
    false,
    null,
  );

  return (
    <div className="staff__page">
      <div className="staff__interaction-bar">
        <Button
          children="Create achievement"
          hidden={creationOpen}
          onClick={onOpenCreation}
        />
      </div>
      <AchievementNavigationBar
        state={state}
        animate={animate}
        dispatchState={dispatchState}
        achievements={achievements}
        isStaff={true}
      />
      <AchievementCreation
        hidden={!creationOpen}
        onCancelCreation={onCancelCreation}
        submitText="Create"
      />
      <div className="staff__achievement-container" ref={scope}>
        {/* sorting for staff page puts everything under the 'values' category */}
        {sortedAchievements["values"].map((a, i) => (
          <Achievement key={i} achievement={a} />
        ))}
      </div>
    </div>
  );
}
