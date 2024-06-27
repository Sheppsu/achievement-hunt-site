import AnimatedPage from "components/AnimatedPage";
import InfoCard from "./info";
import TeamsCard from "./teams";

import "assets/css/achievements/index.css";

export default function AchievementsIndex() {
  return (
    <AnimatedPage>
      <div className="index-container">
        <div className="card-container teams">
          <TeamsCard />
        </div>
        <div className="card-container info">
          <InfoCard />
        </div>
      </div>
    </AnimatedPage>
  );
}
