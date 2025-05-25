import { useGetAnnouncements } from "api/query.ts";
import { AnnouncementType } from "api/types/AnnouncementType.ts";
import RenderedText from "components/common/RenderedText.tsx";

function Announcement({ announcement }: { announcement: AnnouncementType }) {
  return (
    <div className="announcement">
      <h1>{announcement.title}</h1>
      <p>
        <RenderedText text={announcement.message} />
      </p>
    </div>
  );
}

export default function AnnouncementsCard() {
  const { data: announcements, isLoading: announcementsLoading } =
    useGetAnnouncements();

  let element;
  if (announcementsLoading) {
    element = <h1>Loading...</h1>;
  } else if (announcements === undefined) {
    element = <h1>Failed to load</h1>;
  } else {
    element = announcements.map((announcement) => (
      <Announcement announcement={announcement} />
    ));
  }

  return (
    <div className="card">
      <h1 className="card--teams__title">Announcements</h1>
      <div className="announcements-container">{element}</div>
    </div>
  );
}
