import discordLogo from "assets/images/discord-logo.png";
export default function Footer() {
  return (
    <footer>
      <div className="footer">
        <a
          className="footer-link"
          href="https://discord.gg/wY9U8h6Hgj"
          target="_blank"
        >
          <img className="footer-image prevent-select" src={discordLogo}></img>
        </a>
        <p className="footer-text prevent-select">
          developed by{" "}
          <a
            href="https://github.com/Sheppsu"
            target="_blank"
            className="footer-text-link"
          >
            sheppsu
          </a>{" "}
          and{" "}
          <a
            href="https://github.com/hrfarmer"
            target="_blank"
            className="footer-text-link"
          >
            aychar
          </a>
        </p>
      </div>
    </footer>
  );
}
