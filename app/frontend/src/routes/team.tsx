import AnimatedPage from "components/AnimatedPage";
import InfoCard from "components/achievements/InfoCard";
import TeamCard from "components/achievements/TeamCard";
import PlacementCard from "components/achievements/PlacementCard";

import "assets/css/team.css";

export default function AchievementsIndex() {
  return (
    <AnimatedPage>
      <div className="index-container">
        <div className="card-container teams">
          <PlacementCard />
          <TeamCard />
        </div>
        <div className="vertical-divider"></div>
        <div className="card-container info">
          <InfoCard />
        </div>
      </div>
    </AnimatedPage>
  );
}
