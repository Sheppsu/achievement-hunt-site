import { useGetAnnouncements } from "api/query.ts";
import { AnnouncementType } from "api/types/AnnouncementType.ts";
import { timeAgo } from "util/helperFunctions.ts";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

function Announcement({ announcement }: { announcement: AnnouncementType }) {
  return (
    <div className="announcement">
      <h1>{announcement.title}</h1>
      <p>
        <Markdown remarkPlugins={[remarkGfm]}>{announcement.message}</Markdown>
      </p>
      <p className="announcement__time-ago">
        {timeAgo(announcement.created_at)}
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
    element = announcements
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
      .map((announcement) => (
        <Announcement key={announcement.id} announcement={announcement} />
      ));
  }

  return (
    <div className="card">
      <h1 className="card__title">Announcements</h1>
      <div className="announcements-container">{element}</div>
    </div>
  );
}
