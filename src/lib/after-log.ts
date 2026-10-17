import { redis, redisConfigured } from "@/lib/redis";

// What the after() demo records once its background work has finished.
export type AfterEntry = {
  id: string;
  respondedAt: number; // when the Server Action returned its response
  finishedAt: number; // when the work scheduled with after() completed
};

const KEY = "lab:after:log";

export async function logAfter(entry: AfterEntry) {
  if (!redisConfigured()) return;
  await redis().pipeline().lpush(KEY, JSON.stringify(entry)).ltrim(KEY, 0, 9).exec();
}

export async function recentAfter(): Promise<AfterEntry[]> {
  return redisConfigured() ? redis().lrange<AfterEntry>(KEY, 0, 9) : [];
}
