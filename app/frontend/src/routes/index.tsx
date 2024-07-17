import { useContext } from "react";
import { Helmet } from "react-helmet";
import AnimatedPage from "components/AnimatedPage";
import { SessionContext } from "contexts/SessionContext";
import InfoCard from "components/achievements/InfoCard";

import "assets/css/index.css";

export default function App() {
  const session = useContext(SessionContext);

  return (
    <>
      <Helmet>
        <title>CTA</title>
      </Helmet>
      <AnimatedPage>
        <div className="banner"></div>
        <div className="index-container"> 
          <div className="card-container">
            <InfoCard />
          </div>
        </div>
      </AnimatedPage>
    </>
  );
}
