"use client";

import { useState } from "react";

// Client Component: calls the route handler from the browser and shows the JSON.
// NEXT_PUBLIC_* variables are copied into the browser bundle at build time.
export function InspectButton() {
  const [result, setResult] = useState<unknown>(null);
  return (
    <>
      <p className="small muted">
        Read in the browser: <code>NEXT_PUBLIC_APP_NAME</code> = <strong>{process.env.NEXT_PUBLIC_APP_NAME ?? "(unset)"}</strong>
      </p>
      <button onClick={async () => setResult(await (await fetch("/api/basics/inspect", { cache: "no-store" })).json())}>
        Call /api/basics/inspect
      </button>
      {result != null && <pre className="json">{JSON.stringify(result, null, 2)}</pre>}
    </>
  );
}
