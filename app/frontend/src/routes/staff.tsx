import { useGetStaffAchievement } from "api/query.ts";
import Achievement from "components/staff/Achievement.tsx";

import "assets/css/staff.css";

export default function Staff() {
  const { data: achievements, isLoading } = useGetStaffAchievement();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (achievements === undefined) {
    return <div>Failed to load achievements</div>;
  }

  return (
    <div className="staff__page">
      {achievements.map((a) => (
        <Achievement achievement={a} />
      ))}
    </div>
  );
}
