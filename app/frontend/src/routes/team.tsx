import AnimatedPage from "components/AnimatedPage";
import TeamCard from "components/achievements/TeamCard";
import LeaderboardCard from "components/achievements/LeaderboardCard";
import { Helmet } from "react-helmet";

import "assets/css/team.css";

export default function AchievementsIndex() {
  return (
    <>
      <Helmet>
        <title>CTA Teams</title>
      </Helmet>
      <AnimatedPage>
        <div className="index-container">
          <TeamCard />
          <div className="vertical-divider"></div>
          <LeaderboardCard />
        </div>
      </AnimatedPage>
    </>
  );
}
