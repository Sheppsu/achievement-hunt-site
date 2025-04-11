import { useParams } from "react-router-dom";
import { useGetStaffAchievement } from "api/query.ts";
import { NotFoundError } from "../../errors/NotFoundError.ts";
import Achievement from "components/staff/Achievement.tsx";

import "assets/css/staff.css";

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

  const { isLoading, data: achievement } =
    useGetStaffAchievement(achievementId);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (achievement === undefined) {
    return <div>Error loading achievement</div>;
  }

  return (
    <div className="staff__page">
      <div className="staff__achievement-container">
        <Achievement achievement={achievement} />
      </div>
    </div>
  );
}
