"use server";

import { checkLimit, demoLimit, retryIn } from "@/lib/redis";

export type LogState = { id: string; at: string } | { error: string } | null;

// Anything a function writes to the console becomes a runtime log on Vercel.
// One JSON object per line keeps logs searchable: filter by the id shown on
// the page in the dashboard's Logs tab, or with `vercel logs`.
export async function writeLog(): Promise<LogState> {
  const limit = await checkLimit(demoLimit);
  if (limit && !limit.success) return { error: `Slow down: try again in ${retryIn(limit.reset)} s.` };
  const id = `lab-${crypto.randomUUID().slice(0, 8)}`;
  const at = new Date().toISOString();
  console.log(JSON.stringify({ event: "lab.demo-log", id, at, region: process.env.VERCEL_REGION ?? "local" }));
  return { id, at };
}
