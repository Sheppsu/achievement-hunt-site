import { useCreateAchievement, useGetStaffAchievement } from "api/query.ts";
import Achievement from "components/staff/Achievement.tsx";

import "assets/css/staff.css";
import { useAuthEnsurer } from "util/auth.ts";
import Button from "components/inputs/Button.tsx";
import TextInput from "components/inputs/TextInput.tsx";
import TextArea from "components/inputs/TextArea.tsx";
import { useState } from "react";
import classNames from "classnames";

export default function Staff() {
  useAuthEnsurer().ensureStaff();

  const { data: achievements, isLoading } = useGetStaffAchievement();

  const [achievementName, setAchievementName] = useState("");
  const [achievementDescription, setAchievementDescription] = useState("");
  const [achievementSolution, setAchievementSolution] = useState("");
  const [achievementTags, setAchievementTags] = useState("");
  const [creationOpen, setCreationOpen] = useState(false);
  const [sendingCreation, setSendingCreation] = useState(false);
  const createAchievement = useCreateAchievement();

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

  const isInputValid = () => {
    return (
      achievementName.length > 0 &&
      achievementDescription.length > 0 &&
      achievementSolution.length > 0 &&
      achievementTags.length > 0
    );
  };

  const onCreate = () => {
    if (!isInputValid() || sendingCreation) {
      return;
    }

    setSendingCreation(true);

    createAchievement.mutate(
      {
        name: achievementName,
        description: achievementDescription,
        solution: achievementSolution,
        tags: achievementTags,
      },
      {
        onSuccess: () => {
          onCancelCreation();
          setAchievementName("");
          setAchievementDescription("");
          setAchievementSolution("");
        },
        onSettled: () => {
          setSendingCreation(false);
        },
      },
    );
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
      <div
        className={classNames("staff__achievement-creation-panel", {
          hide: !creationOpen,
        })}
      >
        <TextInput
          placeholder="Achievement name"
          style={{ width: "auto" }}
          className="staff__text-input"
          value={achievementName}
          onChange={(e: React.FormEvent<HTMLInputElement>) => {
            setAchievementName(e.currentTarget.value);
          }}
        />
        <TextArea
          className="staff__textarea"
          placeholder="Achievement description"
          value={achievementDescription}
          onChange={(e: React.FormEvent<HTMLTextAreaElement>) => {
            setAchievementDescription(e.currentTarget.value);
          }}
        />
        <TextArea
          className="staff__textarea"
          placeholder="Achievement solution (N/A for explicit achievements)"
          value={achievementSolution}
          onChange={(e: React.FormEvent<HTMLTextAreaElement>) => {
            setAchievementSolution(e.currentTarget.value);
          }}
        />
        <TextInput
          placeholder="Achievement tags"
          style={{ width: "auto" }}
          className="staff__text-input"
          value={achievementTags}
          onChange={(e: React.FormEvent<HTMLInputElement>) => {
            setAchievementTags(e.currentTarget.value);
          }}
        />
        <div className="staff__achievement-creation-panel__row">
          <Button children="Create" onClick={onCreate} />
          <Button children="Cancel" onClick={onCancelCreation} />
        </div>
      </div>
      {achievements.map((a, i) => (
        <Achievement key={i} achievement={a} />
      ))}
    </div>
  );
}
