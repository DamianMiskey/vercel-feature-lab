"use client";

import { useState } from "react";

// Reads the route handler's response body as it arrives, instead of waiting
// for the whole thing like response.json() would.
export function StreamReader() {
  const [lines, setLines] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  async function start() {
    setLines([]);
    setRunning(true);
    try {
      const res = await fetch("/api/streaming", { cache: "no-store" });
      const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        setLines((prev) => [...prev, ...value.split("\n").filter(Boolean)]);
      }
    } catch {
      setLines((prev) => [...prev, "Stream failed."]);
    } finally {
      setRunning(false);
    }
  }

  return (
    <>
      <button onClick={start} disabled={running}>{running ? "Streaming…" : "Start stream"}</button>
      {lines.length > 0 && <pre className="json">{lines.join("\n")}</pre>}
    </>
  );
}
