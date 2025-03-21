import classNames from "classnames";
import TextInput from "components/inputs/TextInput.tsx";
import TextArea from "components/inputs/TextArea.tsx";
import Button from "components/inputs/Button.tsx";
import { useContext, useState } from "react";
import { useCreateAchievement, useEditAchievement } from "api/query.ts";
import { StaffAchievementType } from "api/types/AchievementType.ts";
import { EventContext } from "contexts/EventContext.ts";
import Dropdown from "components/inputs/Dropdown.tsx";
import { parseMode, parseTags } from "util/helperFunctions.ts";

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
    parseTags(achievement?.tags ?? "", false).join(","),
  );
  const [achievementBeatmaps, setAchievementBeatmaps] = useState(
    achievement
      ? achievement.beatmaps.map((b) => ({
          hide: b.hide,
          id: b.info.id.toString(),
        }))
      : [],
  );
  const [achievementMode, setAchievementMode] = useState(
    parseMode(achievement?.tags ?? ""),
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
    for (const beatmap of achievementBeatmaps) {
      if (isNaN(parseInt(beatmap.id.trim()))) {
        if (showError)
          dispatchEventMsg({
            type: "error",
            msg: "Invalid beatmap id (make sure it's id, not link)",
          });
        return false;
      }
    }
    return true;
  };

  const onCreate = () => {
    if (!isInputValid(true) || sendingCreation) {
      return;
    }

    setSendingCreation(true);

    let tags = achievementTags;
    if (achievementMode !== "any") {
      if (tags.trim().length != 0 && !tags.endsWith(",")) {
        tags += ",";
      }
      tags += achievementMode;
    }

    saveAchievement.mutate(
      {
        name: achievementName,
        description: achievementDescription,
        solution: achievementSolution,
        tags,
        beatmaps: achievementBeatmaps.map((beatmap) => ({
          hide: beatmap.hide,
          id: parseInt(beatmap.id),
        })),
      },
      {
        onSuccess: () => {
          props.onCancelCreation();
          if (achievement === undefined) {
            setAchievementName("");
            setAchievementDescription("");
            setAchievementSolution("");
            setAchievementTags("");
            setAchievementBeatmaps([]);
          }
        },
        onSettled: () => {
          setSendingCreation(false);
        },
      },
    );
  };

  const onBeatmapChange = (
    i: number,
    field: "hide" | "id",
    value: string | boolean,
  ) => {
    setAchievementBeatmaps((beatmaps) => {
      const newItem = beatmaps[i];
      // @ts-ignore
      newItem[field] = value;
      return beatmaps.slice(0, i).concat([newItem], beatmaps.slice(i + 1));
    });
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
      <div className="staff__achievement-creation-panel__row">
        <p>Gamemode:</p>
        <Dropdown
          options={{
            Any: "any",
            Standard: "mode-o",
            Taiko: "mode-t",
            Mania: "mode-m",
            Catch: "mode-f",
          }}
          onChange={(e: React.FormEvent<HTMLSelectElement>) => {
            setAchievementMode(e.currentTarget.value);
          }}
          value={achievementMode}
        />
      </div>
      {achievementBeatmaps.map((beatmap, i) => (
        <div key={i} className="staff__achievement-creation-panel__row">
          <input
            type="checkbox"
            checked={beatmap.hide}
            onChange={(e: React.FormEvent<HTMLInputElement>) =>
              onBeatmapChange(i, "hide", e.currentTarget.checked)
            }
          />
          <p>Hide</p>
          <TextInput
            placeholder="Beatmap id"
            style={{ width: "auto" }}
            value={beatmap.id}
            onChange={(e: React.FormEvent<HTMLInputElement>) =>
              onBeatmapChange(i, "id", e.currentTarget.value)
            }
          />
          <Button
            children="Remove"
            onClick={() =>
              setAchievementBeatmaps((beatmaps) =>
                beatmaps.slice(0, i).concat(beatmaps.slice(i + 1)),
              )
            }
          />
        </div>
      ))}

      <div className="staff__achievement-creation-panel__row right">
        <Button
          children="Add beatmap"
          onClick={() =>
            setAchievementBeatmaps((beatmaps) =>
              beatmaps.concat([{ hide: false, id: "" }]),
            )
          }
        />
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
