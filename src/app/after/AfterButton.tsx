"use client";

import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { type AfterState, startJob } from "./actions";

type ButtonState = (AfterState & { tookMs?: number }) | null;

// Times the round trip in the browser, then refreshes the log once the
// background work should be done.
export function AfterButton() {
  const router = useRouter();
  const [state, action, pending] = useActionState<ButtonState>(async () => {
    const sentAt = performance.now();
    const result = await startJob();
    if (result && "id" in result) setTimeout(() => router.refresh(), 2500);
    return result && { ...result, tookMs: Math.round(performance.now() - sentAt) };
  }, null);

  return (
    <form action={action}>
      <button type="submit" disabled={pending}>{pending ? "Waiting for the response…" : "Start a job"}</button>
      {state && "error" in state && <p className="error" role="status">{state.error}</p>}
      {state && "id" in state && (
        <p role="status">
          Response for job <code>{state.id}</code> arrived after <strong>{state.tookMs} ms</strong>. The 2-second work is still
          running on the server; the log below refreshes when it&apos;s done.
        </p>
      )}
    </form>
  );
}
