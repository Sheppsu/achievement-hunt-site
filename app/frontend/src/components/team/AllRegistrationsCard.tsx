import { useGetAllRegistrations } from "api/query.ts";
import TextCard from "components/cards/TextCard.tsx";
import UserCard from "components/common/UserCard.tsx";

export default function AllRegistrationsCard() {
  const { data: registrations, isLoading } = useGetAllRegistrations();

  if (isLoading) {
    return <TextCard text="Loading registrations..." />;
  }

  if (registrations === undefined) {
    return <TextCard text="Failed to load registrations" />;
  }

  return (
    <div className="card">
      <h1>{registrations.registration_count} registrations</h1>
      {registrations.registrations !== undefined ? (
        <div
          className="card--teams__container players"
          style={{ overflow: "auto" }}
        >
          {registrations.registrations
            .sort((a, b) => a.user.username.localeCompare(b.user.username))
            .map((reg) => (
              <UserCard key={reg.user.id} user={reg.user} />
            ))}
        </div>
      ) : (
        ""
      )}
    </div>
  );
}
