import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// revalidateTag needs a running Next.js server, so it's replaced with a spy.
// connection() would wait for a real request, so it resolves straight away.
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("next/server", () => ({ connection: () => Promise.resolve() }));
vi.mock("@/lib/delay", () => ({ delay: () => Promise.resolve() }));

const { revalidateTag } = await import("next/cache");
const { POST: revalidate } = await import("@/app/api/static/revalidate/route");
const { GET: stream } = await import("@/app/api/streaming/route");
const { ON_DEMAND_TAG, isAuthorized } = await import("@/lib/revalidate");

const post = (headers: Record<string, string> = {}) =>
  revalidate(new Request("https://vercel.djmiskey.com/api/static/revalidate", { method: "POST", headers }));

describe("isAuthorized", () => {
  it("accepts only the exact bearer token", () => {
    expect(isAuthorized("Bearer s3cret", "s3cret")).toBe(true);
    expect(isAuthorized("Bearer s3cre", "s3cret")).toBe(false);
    expect(isAuthorized("s3cret", "s3cret")).toBe(false);
    expect(isAuthorized(null, "s3cret")).toBe(false);
  });
});

describe("POST /api/static/revalidate", () => {
  beforeEach(() => vi.stubEnv("REVALIDATE_SECRET", "s3cret"));
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.mocked(revalidateTag).mockClear();
  });

  it("refuses to run without a configured secret", async () => {
    vi.stubEnv("REVALIDATE_SECRET", "");
    expect((await post({ authorization: "Bearer " })).status).toBe(503);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("rejects a wrong or missing token", async () => {
    expect((await post()).status).toBe(401);
    expect((await post({ authorization: "Bearer nope" })).status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("revalidates the tag with stale-while-revalidate", async () => {
    const res = await post({ authorization: "Bearer s3cret" });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ revalidated: true, tag: ON_DEMAND_TAG });
    expect(revalidateTag).toHaveBeenCalledWith(ON_DEMAND_TAG, "max");
  });
});

describe("GET /api/streaming", () => {
  it("streams five lines", async () => {
    const res = await stream();
    expect(res.headers.get("content-type")).toContain("text/plain");
    const lines = (await res.text()).trim().split("\n");
    expect(lines).toHaveLength(5);
    expect(lines[4]).toMatch(/^chunk 5\/5 at /);
  });
});
