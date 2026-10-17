"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";

// useChat keeps the conversation, posts it to the route and renders the reply
// as it streams in. Messages are lists of parts (text, tool calls, files…);
// this chat only uses text.
export function Chat() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error, stop } = useChat({
    // A fixed id: otherwise useChat makes a random one while the page is
    // prerendered, which Cache Components refuses.
    id: "lab-chat",
    transport: new DefaultChatTransport({ api: "/api/ai/chat" }),
  });
  const busy = status === "submitted" || status === "streaming";

  return (
    <>
      <div className="chat-log" aria-live="polite">
        {messages.length === 0 && <p className="muted small">Ask anything. The reply streams in word by word.</p>}
        {messages.map((m) => (
          <p key={m.id}>
            <strong>{m.role === "user" ? "You" : "Lab"}:</strong>{" "}
            {m.parts.map((part, i) => (part.type === "text" ? <span key={i}>{part.text}</span> : null))}
          </p>
        ))}
      </div>
      {error && <p className="error" role="alert">{error.message.includes("429") || error.message.includes("Slow down") ? "Slow down a little and try again." : "Something went wrong. Try again."}</p>}
      <form
        className="form-row"
        onSubmit={(e) => {
          e.preventDefault();
          const text = input.trim();
          if (!text || busy) return;
          sendMessage({ text });
          setInput("");
        }}
      >
        <label className="grow">Message<input value={input} onChange={(e) => setInput(e.target.value)} maxLength={500} placeholder="What does streamText do?" /></label>
        {busy ? <button type="button" className="ghost" onClick={stop}>Stop</button> : <button type="submit" disabled={!input.trim()}>Send</button>}
      </form>
    </>
  );
}
