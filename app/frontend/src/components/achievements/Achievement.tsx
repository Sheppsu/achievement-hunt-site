import { useContext, useEffect, useState, useRef } from "react";
import { useGetTeams } from "api/query";
import { AchievementCompletionType } from "api/types/AchievementCompletionType";
import { AchievementPlayerExtendedType } from "api/types/AchievementPlayerType";
import { AchievementExtendedType } from "api/types/AchievementType";
import { SessionContext } from "contexts/SessionContext";
import { WebsocketState } from "./AchievementProgress";
import { toTitleCase } from "util/helperFunctions";
import AudioPlayer from "components/audio/AudioPlayer";

function timeAgo(timestamp: string) {
  const times: [number, string][] = [
    [60, "minute"],
    [60, "hour"],
    [24, "day"],
  ];
  const now = Date.now();
  const completion = Date.parse(timestamp);

  let leftover1 = Math.round((now - completion) / 1000);
  let label1 = "second";
  let leftover2: number | null = null;
  let label2: string | null = null;
  for (const [div, label] of times) {
    if (leftover1 < div) {
      break;
    }

    leftover2 = leftover1 % div;
    label2 = label1;
    leftover1 = Math.floor(leftover1 / div);
    label1 = label;
  }

  if (leftover1 !== 1) {
    label1 += "s";
  }

  if (leftover2 === null) {
    return `${leftover1} ${label1} ago`;
  }

  if (leftover2 !== 1) {
    label2 += "s";
  }

  return `${leftover1} ${label1} ${leftover2} ${label2} ago`;
}

export default function Achievement({
  achievement,
  state,
}: {
  achievement: AchievementExtendedType;
  state: WebsocketState;
}) {
  const session = useContext(SessionContext);
  const { data: teams } = useGetTeams();
  const players: [AchievementPlayerExtendedType, AchievementCompletionType][] =
    [];
  let completed: boolean = false;
  const tags = achievement.tags.split(",");

  // get players with achievement completed and check if team completed
  if (teams !== undefined) {
    for (const team of teams) {
      if (!("players" in team)) {
        continue;
      }

      let teamCompleted = false;
      let sameTeam = false;
      for (const player of team.players) {
        if (player.user.id === session.user?.id) {
          sameTeam = true;
        }

        for (const completion of player.completions) {
          if (completion.achievement_id === achievement.id) {
            players.push([player, completion]);
            teamCompleted = true;
            break;
          }
        }
      }

      if (teamCompleted && sameTeam) {
        completed = true;
      }
    }
  }

  const infoCls =
    "achievement-info-container" + (completed ? " complete" : " incomplete");

              
  console.log(achievement.beatmap)
  return (
    <>
      {state.hideCompletedAchievements && completed ? (
        <></>
      ) : (
        <div className="achievement">
          <div className={infoCls}>
            <div className="achievement-info">
              <h1>{achievement.name}</h1>
              <p>
                {achievement.completion_count} completions |{" "}
                {achievement.description}
              </p>
              {tags[0] !== "" && (
                <div className="achievement-tags-container">
                  {tags.map((tag) => (
                    <div className="achievement-tag">{toTitleCase(tag)}</div>
                  ))}
                </div>
              )}
            </div>
            <h1>{completed ? "Complete" : "Incomplete"}</h1>
          </div>

          {achievement.audio === null ? (
            ""
            ) : (
            <AudioPlayer
               currentSong={achievement.audio}
            />
          )}  

          {achievement.beatmap === null ? (
            ""
          ) : (
              <a
              href={`https://osu.ppy.sh/b/${achievement.beatmap.id}`}
              target="_blank"
            >
              <div className="achievement-details-container">
                <img
                  className="achievement-details-cover"
                  src={achievement.beatmap.cover}
                ></img>
                <div className="achievement-details-beatmap-info">
                  <p className="achievement-details-beatmap-info-text">
                    {achievement.beatmap.artist} - {achievement.beatmap.title}
                  </p>
                  <p className="achievement-details-beatmap-info-text">
                    [{achievement.beatmap.version}]
                  </p>
                </div>
                <h1 className="achievement-details-star-rating">
                  {achievement.beatmap.star_rating}*
                </h1>
              </div>
            </a>
          )}

          {achievement.beatmap === null || players.length === 0 ? "" : <hr />}
          {players.length == 0 ? (
            ""
          ) : (
            <div className="achievement-players-container">
              {players
                .sort(
                  (a, b) =>
                    Date.parse(a[1].time_completed) -
                    Date.parse(b[1].time_completed)
                )
                .map(([player, completion]) => (
                  <div className="achievement-players-entry">
                    <img
                      className="achievement-players-entry-pfp"
                      src={player.user.avatar}
                    ></img>
                    <div>
                      <p>
                        <b>{player.user.username}</b>
                      </p>
                      <p style={{ fontSize: "14px" }}>
                        {timeAgo(completion.time_completed)}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
