import { Helmet } from "react-helmet";
import InfoCard from "components/achievements/InfoCard";

import "assets/css/index.css";
import banner from "../../../static/assets/banner.png";
import { useGetIteration } from "api/query.ts";
import TextCard from "components/cards/TextCard.tsx";

export default function App() {
  const { data: iteration, isLoading: iterationLoading } = useGetIteration();

  const title = iteration === undefined ? "CTA" : iteration.name;

  let card;
  if (iterationLoading) {
    card = <TextCard text="Loading..." />;
  } else if (iteration === undefined) {
    card = <TextCard text="Failed to load iteration" />;
  } else {
    card = <InfoCard iteration={iteration} />;
  }

  return (
    <>
      <Helmet>
        <title>{title}</title>
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
        <div className="cards-container__column">{card}</div>
      </div>
    </>
  );
}
