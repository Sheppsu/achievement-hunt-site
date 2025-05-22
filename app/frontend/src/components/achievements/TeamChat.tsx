import { WebsocketContext } from "contexts/WebsocketContext";
import { FormEvent, useContext, useEffect, useState } from "react";

export default function TeamChat() {
  const [value, setValue] = useState<string>("");
  const { wsState, sendChatMessage } = useContext(WebsocketContext)!;

  const onChatSend = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const msg = new FormData(e.currentTarget).get("chat-value") as string;
    sendChatMessage(msg);
    setValue("");
  };

  useEffect(() => {});

  return (
    <div className="card">
      <p className="card--teams__title">Chat</p>
      <div className="team-chat">
        <div className="team-chat__messages">
          {wsState.teamMessages.map((msg, idx) => (
            <p key={idx}>
              <span style={{ color: msg.color }}>{msg.name}</span>:{" "}
              {msg.message}
            </p>
          ))}
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
        />
      </form>
    </div>
  );
}
