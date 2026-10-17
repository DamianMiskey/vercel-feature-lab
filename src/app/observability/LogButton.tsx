"use client";

import { useActionState } from "react";
import { type LogState, writeLog } from "./actions";

export function LogButton() {
  const [state, action, pending] = useActionState<LogState>(writeLog, null);
  return (
    <form action={action}>
      <button type="submit" disabled={pending}>Write a log line</button>
      {state && "error" in state && <p className="error" role="status">{state.error}</p>}
      {state && "id" in state && (
        <p role="status">
          Logged <code>{state.id}</code> at <span className="stamp">{state.at.slice(11, 19)}</span> UTC. Search for that id in the
          project&apos;s <strong>Logs</strong> tab.
        </p>
      )}
    </form>
  );
}
