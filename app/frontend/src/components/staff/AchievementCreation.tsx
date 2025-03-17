import classNames from "classnames";
import TextInput from "components/inputs/TextInput.tsx";
import TextArea from "components/inputs/TextArea.tsx";
import Button from "components/inputs/Button.tsx";
import { useContext, useState } from "react";
import { useCreateAchievement, useEditAchievement } from "api/query.ts";
import { StaffAchievementType } from "api/types/AchievementType.ts";
import { EventContext } from "contexts/EventContext.ts";

type AchievementCreationProps = {
  hidden: boolean;
  onCancelCreation: () => void;
  submitText: string;
  achievement?: StaffAchievementType;
};

export default function AchievementCreation(props: AchievementCreationProps) {
  const achievement = props.achievement;

  const [achievementName, setAchievementName] = useState(
    achievement?.name ?? "",
  );
  const [achievementDescription, setAchievementDescription] = useState(
    achievement?.description ?? "",
  );
  const [achievementSolution, setAchievementSolution] = useState(
    achievement?.solution ?? "",
  );
  const [achievementTags, setAchievementTags] = useState(
    achievement?.tags ?? "",
  );
  const [achievementBeatmapId, setAchievementBeatmapId] = useState(
    achievement?.beatmap?.id?.toString() ?? "",
  );
  const [sendingCreation, setSendingCreation] = useState(false);
  const saveAchievement =
    achievement === undefined
      ? useCreateAchievement()
      : useEditAchievement(achievement.id);

  const dispatchEventMsg = useContext(EventContext);

  const isInputValid = (showError = false) => {
    if (achievementName.length === 0) {
      if (showError) dispatchEventMsg({ type: "error", msg: "Missing name" });
      return false;
    }
    if (achievementDescription.length === 0) {
      if (showError)
        dispatchEventMsg({ type: "error", msg: "Missing description" });
      return false;
    }
    if (
      achievementBeatmapId.trim().length !== 0 &&
      isNaN(parseInt(achievementBeatmapId.trim()))
    ) {
      if (showError)
        dispatchEventMsg({
          type: "error",
          msg: "Invalid beatmap id (make sure it's id, not link)",
        });
      return false;
    }
    return true;
  };

  const onCreate = () => {
    if (!isInputValid(true) || sendingCreation) {
      return;
    }

    setSendingCreation(true);

    saveAchievement.mutate(
      {
        name: achievementName,
        description: achievementDescription,
        solution: achievementSolution,
        tags: achievementTags,
        beatmap_id: parseInt(achievementBeatmapId.trim()),
      },
      {
        onSuccess: () => {
          props.onCancelCreation();
          if (achievement === undefined) {
            setAchievementName("");
            setAchievementDescription("");
            setAchievementSolution("");
            setAchievementTags("");
            setAchievementBeatmapId("");
          }
        },
        onSettled: () => {
          setSendingCreation(false);
        },
      },
    );
  };

  return (
    <div
      className={classNames("staff__achievement-creation-panel", {
        hide: props.hidden,
      })}
    >
      <TextInput
        placeholder="Type achievement name"
        style={{ width: "auto" }}
        className="staff__text-input"
        value={achievementName}
        onChange={(e: React.FormEvent<HTMLInputElement>) => {
          setAchievementName(e.currentTarget.value);
        }}
      />
      <TextArea
        className="staff__textarea"
        placeholder="Type description here"
        value={achievementDescription}
        onChange={(e: React.FormEvent<HTMLTextAreaElement>) => {
          setAchievementDescription(e.currentTarget.value);
        }}
      />
      <TextArea
        className="staff__textarea"
        placeholder="Type solution here (for non-explicit achievements)"
        value={achievementSolution}
        onChange={(e: React.FormEvent<HTMLTextAreaElement>) => {
          setAchievementSolution(e.currentTarget.value);
        }}
      />
      <TextInput
        placeholder="Type tags here (e.g. 'gimmick,lazer,reading')"
        style={{ width: "auto" }}
        className="staff__text-input"
        value={achievementTags}
        onChange={(e: React.FormEvent<HTMLInputElement>) => {
          setAchievementTags(e.currentTarget.value);
        }}
      />
      <TextInput
        placeholder="Type beatmap id here (or leave empty)"
        style={{ width: "auto" }}
        className="staff__text-input"
        value={achievementBeatmapId}
        onChange={(e: React.FormEvent<HTMLInputElement>) => {
          setAchievementBeatmapId(e.currentTarget.value);
        }}
      />
      <div className="staff__achievement-creation-panel__row">
        <Button
          children={props.submitText}
          onClick={onCreate}
          unavailable={sendingCreation}
        />
        <Button children="Cancel" onClick={props.onCancelCreation} />
      </div>
    </div>
  );
}
