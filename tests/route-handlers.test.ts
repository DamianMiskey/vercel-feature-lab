import { describe, expect, it } from "vitest";
import { GET as inspect } from "@/app/api/basics/inspect/route";
import { GET as health } from "@/app/api/health/route";

// Route handlers are plain functions from Request to Response, so they can be
// called directly, with no server running.
describe("route handlers", () => {
  it("GET /api/health", async () => {
    const res = health();
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true });
  });

  it("GET /api/basics/inspect echoes request and geo info", async () => {
    const res = inspect(new Request("https://vercel.djmiskey.com/api/basics/inspect", {
      headers: { "x-vercel-id": "cpt1::fra1::xyz", "x-vercel-ip-country": "ZA" },
    }));
    expect(await res.json()).toMatchObject({
      method: "GET",
      edgeRegion: "cpt1",
      functionRegion: "fra1",
      geo: { country: "ZA" },
      runtime: { node: process.version },
    });
  });
});
