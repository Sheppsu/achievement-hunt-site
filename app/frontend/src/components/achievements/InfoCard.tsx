import "assets/css/team.css";

export default function InfoCard() {
  return (
    <div className="card">
      <h1 className="info-title">Capture The Achievement</h1>
      <p className="info-text">
        Starts November 16th - Ends November 25th (0:00 UTC)
      </p>
      <p className="info-subtitle">About</p>
      <p className="info-text">
        CTA is a 9-day event that combines medal hunting and competition into a
        fun team-based format (inspired in part by osu!CTF). It does not involve
        osu!'s official medals, and instead has unique "achievements" with
        criteria ranging from high-level scores to secret requirements (like
        hush-hush medals). If it sounds fun, please consider joining! You can
        play solo or create a team of friends (max 5 players); just click
        "Teams" on the header at the top.
      </p>
      <p className="info-subtitle">Teams</p>
      <p className="info-text">
        You can create/join a team anytime before or during the event. Teams are
        limited to 5 players maximum. The limitation is to keep it fair between
        teams and encourage diversifying your team's skills. During the event,
        you will not be able to see team names in an effort to prevent "profile
        stalking" (more on that below). However, after the event, they will be
        revealed along with the players.
      </p>
      <p className="info-subtitle">Achievements</p>
      <p className="info-text">
        There will be 100 achievements in total, with the first day having 30,
        and 10 more being released every 24 hours. I will try to release a
        relatively balanced number of easy, difficult, and types of
        achievements. There is a possibility of having bugged achievements, but
        there will be tests in place to hopefully avoid having any. In the case
        that an explicit achievement doesn't award a completion, you can make a
        post in the "feedback-and-bugs" forum channel on the discord server. If
        you believe a secret or knowledge achievement is bugged, you may post in
        the forum channel, but <b>do not</b> mention what you tried (to avoid
        giving away the solution).
      </p>
      <p className="info-subtitle">Scoring</p>
      <p className="info-text">
        Each achievement is worth between 10 and 100 points. The more
        completions an achievement has, the less it is worth. A team's total
        score is the sum of their completions' worth. This means a team's score
        can decrease as achievements gain more completions. Competition
        achievements have a different score calculation; the same concept is
        applied but using the player's placement on the achievement to determine
        rewarded score. Score scales according to the function seen{" "}
        <a
          className="external-link"
          href="https://www.desmos.com/calculator/tjq7lcnyo5"
          target="_blank"
        >
          here
        </a>
        .
      </p>
      <p className="info-subtitle">Profile stalking</p>
      <p className="info-text">
        The major flaw with this format is being able to see a player's recent
        scores on their profile, which is detrimental to secret and knowledge
        achievements. To mitigate this, we've taken several precautions
        regarding the information that's displayed on the site and by warning
        about it. Please <b>DO NOT</b> engage in profile stalking, as it ruins
        the event for others. Additionally, be cautious to avoid giving others
        the opportunity to profile stalk you, such as openly talking about
        completing any secret or knowledge achievements.
      </p>
    </div>
  );
}
