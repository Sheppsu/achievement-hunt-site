import { Helmet } from "react-helmet";
import "assets/css/admin.css";
import React from "react";
import BatchesCard from "components/admin/BatchesCard.tsx";
import AnnouncementCreationCard from "components/admin/AnnouncementCreationCard.tsx";
import { useAuthEnsurer } from "util/auth.ts";

export default function AdminPage() {
  useAuthEnsurer().ensureAdmin();

  return (
    <>
      <Helmet>
        <title>CTA - Admin</title>
      </Helmet>

      <div className="cards-container">
        <div className="cards-container__column">
          <AnnouncementCreationCard />
        </div>
        <div className="card-vertical-divider"></div>
        <div className="cards-container__column">
          <BatchesCard />
        </div>
      </div>
    </>
  );
}
