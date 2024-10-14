import AnimatedPage from "components/AnimatedPage.tsx";
import {Helmet} from "react-helmet";

import "assets/css/staff.css";

export default function StaffPage() {
  return (
    <AnimatedPage>
      <Helmet>
        <title>CTA - Staff</title>
      </Helmet>

      <div className="index-container">
        <div className="card-container">
          <div className="info-container">
            <h1 className="staff-header">Host</h1>
            <div className="staff-container">
              <a href="https://sheppsu.me" target="_blank" className="external-link staff">Sheppsu</a>
            </div>
            <h1 className="staff-header">Website developers</h1>
            <div className="staff-container">
              <a href="https://sheppsu.me" target="_blank" className="external-link staff">Sheppsu</a>
              <a href="https://aychar.dev" target="_blank" className="external-link staff">aychar</a>
              <a href="https://github.com/Rinne0333" target="_blank" className="external-link staff">Rinne</a>
            </div>
            <h1 className="staff-header">Achievement masterminds</h1>
            <div className="staff-container">
              <a href="https://osu.ppy.sh/users/7772622" target="_blank" className="external-link staff">rc4322 / TamamoLover</a>
              <a href="https://osu.ppy.sh/users/14177677" target="_blank" className="external-link staff">Whatsoever545</a>
              <a href="https://osu.ppy.sh/users/14208558" target="_blank" className="external-link staff">Alanko</a>
              <a href="https://osu.ppy.sh/users/11153810" target="_blank" className="external-link staff">Anonymoose</a>
            </div>
          </div>
        </div>
      </div>
    </AnimatedPage>
);
}