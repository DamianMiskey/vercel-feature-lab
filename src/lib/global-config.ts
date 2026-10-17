import { getAll } from "@vercel/global-config";
import { connection } from "next/server";

// The items in the lab's Global Config store (formerly Edge Config), named
// feature-lab. The SDK finds the store through the GLOBAL_CONFIG connection
// string. Values are edited in the dashboard or with the CLI, never by the app.
export type LabConfig = {
  banner?: { enabled?: boolean; message?: string; tone?: "info" | "warning" };
  featured?: string;
  rollout?: Record<string, number>;
};

export type ConfigRead = { ok: true; config: LabConfig; ms: number } | { ok: false; reason: string };

// Reads every item at request time (Global Config reads are always fresh,
// so they make the component dynamic). Never throws: a missing or broken
// store must not take the page down.
export async function readLabConfig(): Promise<ConfigRead> {
  await connection();
  if (!process.env.GLOBAL_CONFIG && !process.env.EDGE_CONFIG) {
    return { ok: false, reason: "GLOBAL_CONFIG isn't set for this environment." };
  }
  const started = performance.now();
  try {
    const config = await getAll<LabConfig>();
    return { ok: true, config: config ?? {}, ms: performance.now() - started };
  } catch (error) {
    // Logged, not shown: SDK errors can include the connection string's URL.
    console.error("Global Config read failed", error);
    return { ok: false, reason: "Couldn't read Global Config." };
  }
}

// Rollout percentage for a flag, clamped to 0–100. Missing means 0 (off).
export function rolloutPercent(config: LabConfig, key: string) {
  const value = config.rollout?.[key];
  return typeof value === "number" && Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
}

// Stable bucket 0–99 for a visitor and flag (FNV-1a hash). Salting with the
// flag key means one visitor isn't always first in line for every rollout.
export function bucketOf(visitorId: string, flagKey: string) {
  let hash = 0x811c9dc5;
  for (const char of `${flagKey}:${visitorId}`) {
    hash ^= char.codePointAt(0)!;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash % 100;
}
