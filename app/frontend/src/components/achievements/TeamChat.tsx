import { useGetTeamMessages } from "api/query";
import { WebsocketContext } from "contexts/WebsocketContext";
import { FormEvent, useContext, useEffect, useRef, useState } from "react";

export default function TeamChat() {
  const [value, setValue] = useState<string>("");
  const { sendChatMessage } = useContext(WebsocketContext)!;
  const { data } = useGetTeamMessages();
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
  }, [data]);

  return (
    <div className="card">
      <p className="card--teams__title">Chat</p>
      <div className="team-chat">
        <div className="team-chat__messages">
          {data && data.length > 0 ? (
            data.map((msg, idx) => (
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
        />
      </form>
    </div>
  );
}
