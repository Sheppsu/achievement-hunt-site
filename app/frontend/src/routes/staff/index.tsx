import { useGetStaffAchievements } from "api/query.ts";
import Achievement from "components/staff/Achievement.tsx";

import "assets/css/staff.css";
import { useAuthEnsurer } from "util/auth.ts";
import Button from "components/inputs/Button.tsx";
import { useContext, useState } from "react";
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
import { SessionContext } from "contexts/SessionContext.ts";

export default function Index() {
  useAuthEnsurer().ensureStaff();

  const { data: achievements, isLoading } = useGetStaffAchievements();
  const state = useStateContext();
  const dispatchState = useDispatchStateContext();
  const [scope, animate] = useAnimate();
  const session = useContext(SessionContext);

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
    // default is standard, so set it to null
    dispatchState({
      id: 4,
      mode: null,
    });
    return <div>Loading...</div>;
  }

  const onOpenCreation = () => {
    setCreationOpen(true);
  };

  const onCancelCreation = () => {
    setCreationOpen(false);
  };

  let filteredAchievements = achievements;
  if (state.showMyAchievements) {
    filteredAchievements = achievements.filter(
      (a) => a.creator !== null && a.creator.id === session.user!.id,
    );
  }

  const sortedAchievements = getSortedAchievements(
    filteredAchievements,
    state.achievementsFilter,
    state.achievementsSearchFilter,
    state.mode,
    false,
    null,
    true,
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
        {(sortedAchievements["values"] ?? []).map((a) => (
          <Achievement key={a.id} achievement={a} />
        ))}
      </div>
    </div>
  );
}
