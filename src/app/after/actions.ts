"use server";

import { after } from "next/server";
import { logAfter } from "@/lib/after-log";
import { delay } from "@/lib/delay";
import { checkLimit, demoLimit, retryIn } from "@/lib/redis";

export type AfterState = { id: string; respondedAt: number } | { error: string } | null;

// Returns straight away. The slow part (2 seconds of "sending an email") is
// handed to after(): Vercel keeps the function alive until it finishes, but
// the visitor isn't kept waiting for it.
export async function startJob(): Promise<AfterState> {
  const limit = await checkLimit(demoLimit);
  if (limit && !limit.success) return { error: `Slow down: try again in ${retryIn(limit.reset)} s.` };

  const id = crypto.randomUUID().slice(0, 8);
  const respondedAt = Date.now();
  after(async () => {
    await delay(2000);
    await logAfter({ id, respondedAt, finishedAt: Date.now() });
  });
  return { id, respondedAt };
}
