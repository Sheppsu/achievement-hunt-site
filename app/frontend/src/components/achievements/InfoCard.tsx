import "assets/css/team.css";
import { EventIterationType } from "api/types/EventIterationType.ts";
import RenderedText from "components/common/RenderedText.tsx";

export default function InfoCard({
  iteration,
}: {
  iteration: EventIterationType;
}) {
  return (
    <div className="card">
      <h1 className="card--teams__title">{iteration.name}</h1>
      <p className="info-text">
        Starts November 16th - Ends November 25th (0:00 UTC)
      </p>
      {Object.entries(iteration.description).map(([section, text]) => (
        <>
          <p className="card--teams__subtitle">{section}</p>
          <p className="info-text">
            <RenderedText text={text}></RenderedText>
          </p>
        </>
      ))}
    </div>
  );
}
