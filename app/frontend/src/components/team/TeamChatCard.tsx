import { useGetTeamMessages } from "api/query.ts";
import { WebsocketContext } from "contexts/WebsocketContext.tsx";
import { FormEvent, useContext, useEffect, useRef, useState } from "react";

export default function TeamChatCard() {
  const [value, setValue] = useState<string>("");
  const { wsState, sendChatMessage } = useContext(WebsocketContext)!;
  const { data: messages } = useGetTeamMessages();
  const msgsEndRef = useRef<HTMLDivElement>(null);

  const onChatSend = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const msg = new FormData(e.currentTarget).get("chat-value") as string;
    sendChatMessage(msg);
    setValue("");
  };

  useEffect(() => {
    if (msgsEndRef.current) {
      msgsEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [messages]);

  const connected = wsState?.connected;

  return (
    <div className="card">
      <p className="card__title">Chat</p>
      <div className="team-chat">
        <div className="team-chat__messages">
          {messages && messages.length > 0 ? (
            messages.map((msg, idx) => (
              <p key={idx}>
                <span className="team-chat__messages--time">
                  {new Date(msg.sent_at).toLocaleTimeString()}
                </span>
                {"   "}
                <span style={{ fontWeight: "500" }}>{msg.name}</span>:{" "}
                {msg.message}
              </p>
            ))
          ) : (
            <p>No messages!</p>
          )}
          <div ref={msgsEndRef} />
        </div>
      </div>
      <form onSubmit={onChatSend}>
        <input
          type="text"
          name="chat-value"
          className="team-chat__input"
          value={value}
          onChange={(e) => setValue(e.currentTarget.value)}
          autoComplete="off"
          placeholder={
            connected ? "Type your message..." : "Websocket server disconnected"
          }
          disabled={!connected}
        />
      </form>
    </div>
  );
}
