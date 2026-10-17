"use server";

import { type LimitResult, checkLimit, demoLimit } from "@/lib/redis";

export type TryState = (LimitResult & { at: number }) | { unavailable: true } | null;

// One click = one request against the demo limit (5 per 30 s per visitor).
export async function tryRequest(): Promise<TryState> {
  const result = await checkLimit(demoLimit);
  return result ? { ...result, at: Date.now() } : { unavailable: true };
}
