import discordLogo from "assets/images/discord-logo.png";
import { WebsocketContext } from "contexts/WebsocketContext";
import { useContext } from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  const { wsState } = useContext(WebsocketContext)!;

  return (
    <footer>
      <div className="footer">
        <div className="footer-left_container">
          <a
            className="footer-img-link"
            href="https://discord.gg/wY9U8h6Hgj"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              className="footer-image prevent-select"
              src={discordLogo}
              alt="Discord Logo"
            />
          </a>
          <p className="footer-text prevent-select">
            developed by{" "}
            <a
              href="https://github.com/Sheppsu"
              target="_blank"
              rel="noopener noreferrer"
              className="external-link"
            >
              sheppsu
            </a>
            {", "}
            <a
              href="https://github.com/hrfarmer"
              target="_blank"
              rel="noopener noreferrer"
              className="external-link"
            >
              aychar
            </a>
            {", and "}
            <a
              href="https://github.com/Rinne0333"
              target="_blank"
              rel="noopener noreferrer"
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

        <div className="footer-ws_container">
          {wsState?.connected ? (
            <>
              <svg width="10" height="10">
                <circle cx="5" cy="5" r="4" fill="green" />
              </svg>
              <p>Connected to server</p>
            </>
          ) : (
            <>
              <svg width="10" height="10">
                <circle cx="5" cy="5" r="4" fill="red" />
              </svg>
              <p>Not connected to server</p>
            </>
          )}
        </div>
      </div>
    </footer>
  );
}
