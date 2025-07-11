import { useGetAllRegistrations } from "api/query.ts";
import TextCard from "components/cards/TextCard.tsx";
import UserCard from "components/common/UserCard.tsx";
import { useState } from "react";
import Button from "components/inputs/Button.tsx";
import classNames from "classnames";

export default function AllRegistrationsCard() {
  const [showPlayers, setShowPlayers] = useState(false);

  const { data: registrations, isLoading } = useGetAllRegistrations();

  if (isLoading) {
    return <TextCard text="Loading registrations..." />;
  }

  if (registrations === undefined) {
    return <TextCard text="Failed to load registrations" />;
  }

  if (registrations.registrations === undefined) {
    return (
      <div className="card">
        <h1>{registrations.registration_count} registrations</h1>
      </div>
    );
  }

  return (
    <div className="card">
      <h1>{registrations.registration_count} registrations</h1>
      <Button
        children={showPlayers ? "Hide" : "Show"}
        onClick={() => setShowPlayers(!showPlayers)}
      />
      <div
        className={classNames("card--teams__container players", {
          hide: !showPlayers,
        })}
        style={{ overflow: "auto" }}
      >
        {registrations.registrations
          .sort((a, b) => a.user.username.localeCompare(b.user.username))
          .map((reg) => (
            <UserCard key={reg.user.id} user={reg.user} />
          ))}
      </div>
    </div>
  );
}
