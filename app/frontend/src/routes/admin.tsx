import { Helmet } from "react-helmet";
import "assets/css/admin.css";
import React from "react";
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
      </div>
    </>
  );
}
