import { del, list } from "@vercel/blob";
import { dbConfigured, sql } from "@/lib/db";
import { redis, redisConfigured } from "@/lib/redis";
import { UPLOAD_PREFIX, blobConfigured } from "@/lib/uploads";

// The nightly cron job (vercel.json → /api/cron/cleanup): removes guestbook
// notes and Blob uploads older than a week, and records each run in Redis.

export const CRON_PATH = "/api/cron/cleanup";
export const CRON_SCHEDULE = "0 3 * * *"; // daily at 03:00 UTC; keep in sync with vercel.json
export const RETENTION_DAYS = 7;

export type CleanupRun = { at: string; trigger: "schedule" | "manual"; notesDeleted: number; blobsDeleted: number; ms: number };

const RUNS_KEY = "lab:cron:runs";

export const retentionCutoff = (now: Date) => new Date(now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

export async function cleanUp(now = new Date()) {
  const cutoff = retentionCutoff(now);
  let notesDeleted = 0;
  let blobsDeleted = 0;
  if (dbConfigured()) {
    notesDeleted = (await sql()`DELETE FROM lab_notes WHERE created_at < ${cutoff.toISOString()} RETURNING id`).length;
  }
  if (blobConfigured()) {
    const { blobs } = await list({ prefix: UPLOAD_PREFIX, limit: 100 });
    const old = blobs.filter((b) => b.uploadedAt < cutoff).map((b) => b.pathname);
    if (old.length) await del(old);
    blobsDeleted = old.length;
  }
  return { notesDeleted, blobsDeleted };
}

// The last ten runs, newest first.
export async function recordRun(run: CleanupRun) {
  if (!redisConfigured()) return;
  await redis().pipeline().lpush(RUNS_KEY, JSON.stringify(run)).ltrim(RUNS_KEY, 0, 9).exec();
}

export async function recentRuns(): Promise<CleanupRun[]> {
  if (!redisConfigured()) return [];
  // @upstash/redis parses JSON values back into objects automatically.
  return redis().lrange<CleanupRun>(RUNS_KEY, 0, 9);
}
