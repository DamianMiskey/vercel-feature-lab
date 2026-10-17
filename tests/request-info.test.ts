import { afterEach, describe, expect, it, vi } from "vitest";
import { geoFrom, requestInfo } from "@/lib/request-info";

describe("requestInfo", () => {
  it("splits x-vercel-id into edge and function regions", () => {
    const info = requestInfo(new Headers({ "x-vercel-id": "cpt1::iad1::abc123-1700000000000-def", host: "vercel.djmiskey.com" }));
    expect(info).toMatchObject({ onVercel: true, edgeRegion: "cpt1", functionRegion: "iad1", host: "vercel.djmiskey.com" });
  });

  // Seen in production: two parts only, edge region + request ID.
  it("uses VERCEL_REGION when x-vercel-id has no function region", () => {
    vi.stubEnv("VERCEL_REGION", "iad1");
    const info = requestInfo(new Headers({ "x-vercel-id": "cpt1::xfpqn-1792226923912-9562768ecb05" }));
    expect(info).toMatchObject({ edgeRegion: "cpt1", functionRegion: "iad1" });
  });

  afterEach(() => { vi.unstubAllEnvs(); });

  it("reports local when Vercel headers are missing", () => {
    expect(requestInfo(new Headers())).toMatchObject({ onVercel: false, edgeRegion: null, functionRegion: null });
  });
});

describe("geoFrom", () => {
  it("reads the x-vercel-ip-* headers and decodes the city", () => {
    const geo = geoFrom(new Headers({
      "x-vercel-ip-country": "ZA",
      "x-vercel-ip-city": "Cape%20Town",
      "x-vercel-ip-timezone": "Africa/Johannesburg",
    }));
    expect(geo).toMatchObject({ country: "ZA", city: "Cape Town", timezone: "Africa/Johannesburg", latitude: null });
  });

  it("decodes non-ASCII city names", () => {
    expect(geoFrom(new Headers({ "x-vercel-ip-city": "S%C3%A3o%20Paulo" })).city).toBe("São Paulo");
  });
});
