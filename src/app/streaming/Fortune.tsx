"use client";

import { use } from "react";

// use() suspends until the server's promise resolves. The nearest <Suspense>
// shows its fallback in the meantime.
export function Fortune({ fortune }: { fortune: Promise<string> }) {
  return <p>🥠 <strong>{use(fortune)}</strong></p>;
}
