import React, { FormEvent, useEffect, useState } from "react";

type ChatMessage = {
  name: string;
  message: string;
  color: string;
};

export default function TeamChatCard() {
  const [value, setValue] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { name: "aychar_", message: "hiiii", color: "red" },
    { name: "aychar_", message: "hiiii", color: "red" },
    { name: "aychar_", message: "hiiii", color: "red" },
    { name: "aychar_", message: "hiiii", color: "red" },
    { name: "aychar_", message: "hiiii", color: "red" },
    { name: "aychar_", message: "hiiii", color: "red" },
    {
      name: "baychar_",
      message:
        "HJFIOPEDAHFIOPEAHFOPIAEOIHFEPW FEDASJ FWEIOPHFE WAPFH WAEP FWAEF AWEF WEAFPEWA FHWEAOPF WAEPIOF ",
      color: "blue",
    },
  ]);

  const onChatSend = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const msg = new FormData(e.currentTarget).get("chat-value") as string;
    setMessages((prevMsgs) => {
      return [...prevMsgs, { name: "aychar_", message: msg, color: "red" }];
    });
    setValue("");
  };

  useEffect(() => {});

  return (
    <div className="card">
      <h1 className="card--teams__title">Chat</h1>
      <div className="team-chat">
        <div className="team-chat__messages">
          {messages.map((msg, idx) => (
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
