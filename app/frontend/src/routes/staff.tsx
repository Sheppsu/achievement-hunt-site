import { useGetStaffAchievement } from "api/query.ts";

export default function Staff() {
  const achievements = useGetStaffAchievement();
  return <div></div>;
}
