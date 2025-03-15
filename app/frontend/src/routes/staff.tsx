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

export default function Staff() {
  useAuthEnsurer().ensureStaff();

  const { data: achievements, isLoading } = useGetStaffAchievement();

  const [creationOpen, setCreationOpen] = useState(false);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (achievements === undefined) {
    return <div>Failed to load achievements</div>;
  }

  const onOpenCreation = () => {
    setCreationOpen(true);
  };

  const onCancelCreation = () => {
    setCreationOpen(false);
  };

  return (
    <div className="staff__page">
      <div className="staff__interaction-bar">
        <Button
          children="Create achievement"
          hidden={creationOpen}
          onClick={onOpenCreation}
        />
      </div>
      <AchievementCreation
        hidden={!creationOpen}
        onCancelCreation={onCancelCreation}
        submitText="Create"
      />
      {achievements.map((a, i) => (
        <Achievement key={i} achievement={a} />
      ))}
    </div>
  );
}
