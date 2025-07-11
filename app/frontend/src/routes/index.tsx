import { Helmet } from "react-helmet";
import InfoCard from "components/achievements/InfoCard";

import "assets/css/index.css";
import { useGetIteration } from "api/query.ts";
import TextCard from "components/cards/TextCard.tsx";
import FAQCard from "components/achievements/FAQCard.tsx";

export default function App() {
  const { data: iteration, isLoading: iterationLoading } = useGetIteration();

  const title = iteration === undefined ? "CTA" : iteration.name;

  const cards = [];
  if (iterationLoading) {
    cards.push(<TextCard text="Loading..." />);
  } else if (iteration === undefined) {
    cards.push(<TextCard text="Failed to load iteration" />);
  } else {
    cards.push(<InfoCard iteration={iteration} />);
    if (iteration.faq.length > 0) cards.push(<FAQCard iteration={iteration} />);
  }

  return (
    <>
      <Helmet>
        <title>CTA - {title}</title>
      </Helmet>
      {iteration?.banner ? (
        <div className="banner-wrapper">
          <img
            className="banner"
            src={`/static/assets/${iteration.banner}`}
            alt="banner"
          ></img>
        </div>
      ) : (
        ""
      )}
      <div className="cards-container">
        <div className="cards-container__column">{cards[0]}</div>
        {cards.length == 2 && (
          <>
            <div className="card-vertical-divider"></div>
            <div className="cards-container__column">{cards[1]}</div>
          </>
        )}
      </div>
    </>
  );
}
