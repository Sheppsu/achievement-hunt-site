import { Helmet } from "react-helmet";
import AnimatedPage from "components/AnimatedPage";
import InfoCard from "components/achievements/InfoCard";

import "assets/css/index.css";
import banner from "assets/images/banner.png";

export default function App() {
  return (
    <>
      <Helmet>
        <title>CTA</title>
      </Helmet>
      <AnimatedPage>
        <div className="banner-wrapper">
          <img className="banner" src={banner} alt="banner"></img>
        </div>
        <div className="index-container">
          <div className="card-container">
            <InfoCard />
          </div>
        </div>
      </AnimatedPage>
    </>
  );
}
