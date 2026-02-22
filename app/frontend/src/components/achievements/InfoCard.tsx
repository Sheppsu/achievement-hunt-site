import "assets/css/team.css";
import { EventIterationType } from "api/types/EventIterationType.ts";
import { dateToText } from "util/helperFunctions.ts";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
      {iteration.description
        .sort((a, b) => a.order - b.order)
        .map((section) => (
          <>
            <p className="card--teams__subtitle">{section.heading}</p>
            <p className="info-text">
              <Markdown remarkPlugins={[remarkGfm]}>{section.text}</Markdown>
            </p>
          </>
        ))}
    </div>
  );
}
