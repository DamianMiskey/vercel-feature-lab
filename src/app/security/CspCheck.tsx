"use client";

import { useSyncExternalStore } from "react";

declare global {
  interface Window {
    __lab?: { nonced?: boolean; injected?: boolean };
  }
}

// Reads what the two inline scripts managed to record. Scripts run while the
// HTML is parsed, before React starts, so the answer is ready on first read.
const read = () => JSON.stringify({ nonced: Boolean(window.__lab?.nonced), injected: Boolean(window.__lab?.injected) });
const subscribe = () => () => {};

export function CspCheck() {
  const snapshot = useSyncExternalStore(subscribe, read, () => "");
  if (!snapshot) return <p className="muted">Checking which scripts ran…</p>;
  const { nonced, injected } = JSON.parse(snapshot) as { nonced: boolean; injected: boolean };
  return (
    <div className="cells">
      <div className="cell">
        <span className="small muted">Script with the nonce</span>
        <strong>{nonced ? "✅ ran" : "❌ didn't run"}</strong>
      </div>
      <div className="cell">
        <span className="small muted">&quot;Injected&quot; script, no nonce</span>
        <strong>{injected ? "⚠️ ran (CSP not enforced)" : "🛡️ blocked by CSP"}</strong>
      </div>
    </div>
  );
}
