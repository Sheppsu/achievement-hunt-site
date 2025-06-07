import React from "react";

export default function UnauthenticatedCard() {
  return (
    <div className="card">
      <div className="card--teams__container">
        <p className="card--teams__container__text">
          Login to see more cards; click the top right osu logo, or (for mobile)
          look inside the header dropdown.
        </p>
      </div>
    </div>
  );
}
