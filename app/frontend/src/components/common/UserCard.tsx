import { UserType } from "api/types/UserType.ts";
import React from "react";

export default function UserCard({ user }: { user: UserType }) {
  return (
    <div className={"card--teams__container--players__player-card"}>
      <img
        className="card--teams__container--players__player-card__avatar"
        src={user.avatar}
        alt=""
      ></img>
      <p className="card--teams__container__text grow">{user.username}</p>
    </div>
  );
}
