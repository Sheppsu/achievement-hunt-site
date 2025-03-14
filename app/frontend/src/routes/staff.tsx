import { useGetStaffAchievement } from "api/query.ts";
import Achievement from "components/staff/Achievement.tsx";

import "assets/css/staff.css";
import { useAuthEnsurer } from "util/auth.ts";

export default function Staff() {
  useAuthEnsurer().ensureStaff();

  const { data: achievements, isLoading } = useGetStaffAchievement();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (achievements === undefined) {
    return <div>Failed to load achievements</div>;
  }

  return (
    <div className="staff__page">
      {achievements.map((a, i) => (
        <Achievement key={i} achievement={a} />
      ))}
    </div>
  );
}
