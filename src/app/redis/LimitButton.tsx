"use client";

import { useActionState } from "react";
import { type TryState, tryRequest } from "./actions";

export function LimitButton() {
  const [state, action, pending] = useActionState<TryState>(tryRequest, null);
  return (
    <form action={action}>
      <button type="submit" disabled={pending}>Send a request</button>
      {state && "unavailable" in state && <p className="error">Redis isn&apos;t connected for this environment.</p>}
      {state && "success" in state && (
        <p role="status" className={state.success ? undefined : "error"}>
          {state.success
            ? <>Allowed. <strong>{state.remaining}</strong> of {state.limit} left in this window.</>
            : <>Blocked (429). The window frees up in <strong>{Math.max(1, Math.ceil((state.reset - state.at) / 1000))} s</strong>.</>}
        </p>
      )}
    </form>
  );
}
