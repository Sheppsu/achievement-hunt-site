import { Helmet } from "react-helmet";
import Achievement from "../components/achievements/Achievement.tsx";
import { useGetAchievement, useGetTeams } from "api/query.ts";
import { useParams } from "react-router-dom";
import { NotFoundError } from "../errors/NotFoundError.ts";
import { useMemo } from "react";
import { createTeamMaps } from "util/helperFunctions.ts";

export default function AchievementPage() {
  const params = useParams();

  let achievementIdParam = params.achievementId;
  if (achievementIdParam === undefined) {
    throw new NotFoundError();
  }

  const achievementId = parseInt(achievementIdParam as string);
  if (isNaN(achievementId)) {
    throw new NotFoundError();
  }

  const { data: achievement, isLoading: achievementLoading } =
    useGetAchievement(achievementId);
  const { data: teamData, isLoading: teamsLoading } = useGetTeams();

  const [playerMap, teamMap] = useMemo(() => {
    if (!teamData) {
      return [null, null];
    }

    return createTeamMaps(teamData.teams);
  }, [teamData]);

  if (achievementLoading || teamsLoading) {
    return <div>Loading...</div>;
  }

  if (achievement === undefined || teamData === undefined) {
    return <div>Error loading achievement</div>;
  }

  return (
    <>
      <Helmet>
        <title>CTA - Staff Achievement</title>
      </Helmet>
      <div className="staff__page">
        <div className="staff__achievement-container">
          <Achievement
            achievement={achievement}
            completed="none"
            points={null}
            teamsMap={teamMap ?? {}}
            playersMap={playerMap ?? {}}
            iterationEnded={true}
            competitionScorings={[]}
            isScoreApproximated={false}
          />
        </div>
      </div>
    </>
  );
}
