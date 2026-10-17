import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

// Upstash Redis, through the Vercel Marketplace. Like Neon, it's spoken to
// over HTTPS, so there are no connections to keep open. Redis.fromEnv() reads
// KV_REST_API_URL and KV_REST_API_TOKEN, which the integration set.

export const redisConfigured = () =>
  Boolean((process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL) && (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN));

// Created on first use, so a build without the variables doesn't fail.
let client: Redis | undefined;
export const redis = () => (client ??= Redis.fromEnv());

const limiters = new Map<string, Ratelimit>();
const limiter = (name: string, tokens: number, window: `${number} s` | `${number} m`) => {
  if (!limiters.has(name)) {
    limiters.set(name, new Ratelimit({ redis: redis(), limiter: Ratelimit.slidingWindow(tokens, window), prefix: `lab:rl:${name}` }));
  }
  return limiters.get(name)!;
};

// Every write in the lab (Blob uploads, guestbook notes) shares one budget per
// visitor; the Redis page has its own, smaller one to play with.
export const writeLimit = () => limiter("writes", 5, "1 m");
export const demoLimit = () => limiter("demo", 5, "30 s");
// CSP reports come from browsers automatically; capped so nobody can flood the log.
export const reportLimit = () => limiter("reports", 20, "1 m");

// Who to count: the visitor's IP. Vercel sets x-forwarded-for itself (any
// value the client sent is replaced), so its first entry can be trusted there.
export async function clientKey() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

export type LimitResult = { success: boolean; limit: number; remaining: number; reset: number };

// Checks a limit, failing open if Redis isn't configured: the demos keep
// working without it, just unthrottled.
export async function checkLimit(get: () => Ratelimit): Promise<LimitResult | null> {
  if (!redisConfigured()) return null;
  const { success, limit, remaining, reset } = await get().limit(await clientKey());
  return { success, limit, remaining, reset };
}

export const retryIn = (reset: number) => Math.max(1, Math.ceil((reset - Date.now()) / 1000));
