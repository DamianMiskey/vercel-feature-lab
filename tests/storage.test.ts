import { afterEach, describe, expect, it, vi } from "vitest";
import { MAX_NOTE_LENGTH, checkNote } from "@/lib/notes";

// headers() needs a request; only checkLimit's fail-open path is tested here.
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
const { checkLimit, redisConfigured, retryIn, writeLimit } = await import("@/lib/redis");

describe("checkNote", () => {
  it("trims and flattens control characters", () => {
    expect(checkNote("  hello\n\tworld\u0000 ")).toEqual({ ok: true, body: "hello world" });
  });

  it("rejects empty and over-long notes", () => {
    expect(checkNote("   ")).toMatchObject({ ok: false });
    expect(checkNote(null)).toMatchObject({ ok: false });
    expect(checkNote("x".repeat(MAX_NOTE_LENGTH))).toMatchObject({ ok: true });
    expect(checkNote("x".repeat(MAX_NOTE_LENGTH + 1))).toMatchObject({ ok: false });
  });
});

describe("rate limit helpers", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("fails open when Redis isn't configured", async () => {
    for (const k of ["KV_REST_API_URL", "KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"]) vi.stubEnv(k, "");
    expect(redisConfigured()).toBe(false);
    expect(await checkLimit(writeLimit)).toBeNull();
  });

  it("rounds the wait up to whole seconds, at least one", () => {
    expect(retryIn(Date.now() + 1500)).toBe(2);
    expect(retryIn(Date.now() - 5000)).toBe(1);
  });
});
