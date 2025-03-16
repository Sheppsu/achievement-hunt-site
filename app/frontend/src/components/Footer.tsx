import discordLogo from "assets/images/discord-logo.png";
import { Link } from "react-router-dom";
export default function Footer() {
  return (
    <footer>
      <div className="footer">
        <a
          className="footer-img-link"
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
            className="external-link"
          >
            sheppsu
          </a>
          {", "}
          <a
            href="https://github.com/hrfarmer"
            target="_blank"
            className="external-link"
          >
            aychar
          </a>
          {", and "}
          <a
            href="https://github.com/Rinne0333"
            target="_blank"
            className="external-link"
          >
            Rinne
          </a>
          {" | "}
          <Link to="/credits" className="external-link">
            See all staff
          </Link>
        </p>
      </div>
    </footer>
  );
}
