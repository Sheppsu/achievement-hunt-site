import "assets/css/team.css";
import { EventIterationType } from "api/types/EventIterationType.ts";
import RenderedText from "components/common/RenderedText.tsx";
import { dateToText } from "util/helperFunctions.ts";

export default function InfoCard({
  iteration,
}: {
  iteration: EventIterationType;
}) {
  return (
    <div className="card no-scroll">
      <h1 className="card__title">{iteration.name}</h1>
      <p className="info-text">
        Starts {dateToText(iteration.start)} - Ends {dateToText(iteration.end)}
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
