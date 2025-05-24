import React from "react";

export default function UnauthenticatedCard() {
  return (
    <div className="card fill">
      <div className="card--teams__container">
        <p className="card--teams__container__text">Not authenticated.</p>
      </div>
    </div>
  );
}
