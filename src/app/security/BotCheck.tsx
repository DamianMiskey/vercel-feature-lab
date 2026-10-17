"use client";

import { useState } from "react";

type Verdict = { isBot: boolean; isHuman: boolean; isVerifiedBot: boolean; bypassed: boolean; message: string };

// A plain fetch from this page: BotID's client script has attached its
// challenge result, so the server can tell a browser from a script.
export function BotCheck() {
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [status, setStatus] = useState<number | null>(null);
  return (
    <>
      <button
        onClick={async () => {
          const res = await fetch("/api/security/botid", { method: "POST" });
          setStatus(res.status);
          setVerdict(await res.json());
        }}
      >
        Call the protected endpoint
      </button>
      {verdict && (
        <p role="status" className={verdict.isBot ? "error" : undefined}>
          {status} · {verdict.message} <span className="small muted">(isHuman: {String(verdict.isHuman)}, isBot: {String(verdict.isBot)}{verdict.bypassed ? ", bypassed in development" : ""})</span>
        </p>
      )}
    </>
  );
}
