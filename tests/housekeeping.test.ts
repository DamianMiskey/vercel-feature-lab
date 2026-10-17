import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CRON_PATH, CRON_SCHEDULE, RETENTION_DAYS, retentionCutoff } from "@/lib/housekeeping";

const { GET: cron } = await import("@/app/api/cron/cleanup/route");
const call = (headers: Record<string, string> = {}) => cron(new Request(`https://vercel.djmiskey.com${CRON_PATH}`, { headers }));

describe("cron config", () => {
  it("vercel.json schedules the cleanup route as the code describes it", () => {
    const config = JSON.parse(readFileSync(path.join(__dirname, "..", "vercel.json"), "utf8"));
    expect(config.crons).toEqual([{ path: CRON_PATH, schedule: CRON_SCHEDULE }]);
  });

  it("keeps a week of data", () => {
    const now = new Date("2026-10-17T03:00:00Z");
    expect(retentionCutoff(now).toISOString()).toBe("2026-10-10T03:00:00.000Z");
    expect(RETENTION_DAYS).toBe(7);
  });
});

describe("GET /api/cron/cleanup", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("refuses to run without CRON_SECRET", async () => {
    vi.stubEnv("CRON_SECRET", "");
    expect((await call({ authorization: "Bearer " })).status).toBe(503);
  });

  it("rejects a missing or wrong secret", async () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    expect((await call()).status).toBe(401);
    expect((await call({ authorization: "Bearer nope" })).status).toBe(401);
  });

  it("runs and reports when the secret is right (no stores configured)", async () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    for (const k of ["DATABASE_URL", "BLOB_STORE_ID", "BLOB_READ_WRITE_TOKEN", "KV_REST_API_URL", "UPSTASH_REDIS_REST_URL"]) vi.stubEnv(k, "");
    const res = await call({ authorization: "Bearer s3cret", "user-agent": "vercel-cron/1.0" });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ trigger: "schedule", notesDeleted: 0, blobsDeleted: 0 });
  });
});
