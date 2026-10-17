import { NextRequest } from "next/server";
import { getRedirectUrl, getRewrittenUrl, isRewrite, unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AB_COOKIE, VISITOR_COOKIE, abTest, authGate, ensureVisitor, geoRewrite, visitorCountry, withProxyHeaders } from "@/lib/proxy-rules";
import { SESSION_COOKIE, createSession, readSession } from "@/lib/session";
import { config, proxy } from "@/proxy";

const BASE = "https://vercel.djmiskey.com";
const req = (path: string, init: { headers?: Record<string, string>; cookies?: Record<string, string> } = {}) => {
  const headers = new Headers(init.headers);
  if (init.cookies) headers.set("cookie", Object.entries(init.cookies).map(([k, v]) => `${k}=${v}`).join("; "));
  return new NextRequest(`${BASE}${path}`, { headers });
};

// The docs call it unstable_doesProxyMatch; 16.3.8 still exports the Middleware name.
describe("proxy matcher", () => {
  it("runs on the Proxy pages and /edge-config only", () => {
    for (const url of ["/proxy", "/proxy/ab", "/proxy/members", "/edge-config"]) {
      expect(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url }), url).toBe(true);
    }
    for (const url of ["/", "/basics", "/api/health", "/_next/static/chunk.js"]) {
      expect(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url }), url).toBe(false);
    }
  });
});

describe("visitorCountry", () => {
  it("reads Vercel's header, lets ?country override it, rejects junk", () => {
    expect(visitorCountry(req("/proxy/geo", { headers: { "x-vercel-ip-country": "ZA" } }))).toBe("ZA");
    expect(visitorCountry(req("/proxy/geo?country=jp", { headers: { "x-vercel-ip-country": "ZA" } }))).toBe("JP");
    expect(visitorCountry(req("/proxy/geo?country=../../etc"))).toBe("XX");
    expect(visitorCountry(req("/proxy/geo"))).toBe("XX");
  });
});

describe("A/B test", () => {
  it("assigns a bucket and saves it in a cookie", () => {
    const res = abTest(req("/proxy/ab"), () => 0.9);
    expect(isRewrite(res)).toBe(true);
    expect(getRewrittenUrl(res)).toBe(`${BASE}/proxy/ab/b`);
    expect(res.cookies.get(AB_COOKIE)?.value).toBe("b");
  });

  it("keeps an existing bucket without resetting the cookie", () => {
    const res = abTest(req("/proxy/ab", { cookies: { [AB_COOKIE]: "a" } }), () => 0.9);
    expect(getRewrittenUrl(res)).toBe(`${BASE}/proxy/ab/a`);
    expect(res.cookies.get(AB_COOKIE)).toBeUndefined();
  });

  it("switches bucket with ?variant and ignores bad values", () => {
    expect(getRewrittenUrl(abTest(req("/proxy/ab?variant=b", { cookies: { [AB_COOKIE]: "a" } })))).toBe(`${BASE}/proxy/ab/b`);
    expect(getRewrittenUrl(abTest(req("/proxy/ab?variant=zzz"), () => 0.1))).toBe(`${BASE}/proxy/ab/a`);
  });
});

describe("geo rewrite", () => {
  it("rewrites to the country page", () => {
    expect(getRewrittenUrl(geoRewrite(req("/proxy/geo", { headers: { "x-vercel-ip-country": "DE" } })))).toBe(`${BASE}/proxy/geo/DE`);
  });
});

describe("session cookie", () => {
  it("round-trips, and rejects tampering, other secrets and expiry", async () => {
    const token = await createSession("Ada", "k1", 1_000);
    expect(await readSession(token, "k1", 2_000)).toEqual({ name: "Ada", expiresAt: 1_000 + 3_600_000 });
    expect(await readSession(token, "k2", 2_000)).toBeNull();
    const [, exp, sig] = token.split(".");
    expect(await readSession([Buffer.from("Eve").toString("base64url"), exp, sig].join("."), "k1", 2_000)).toBeNull();
    expect(await readSession(token, "k1", 1_000 + 3_600_000)).toBeNull();
    expect(await readSession("garbage", "k1")).toBeNull();
    expect(await readSession(undefined, "k1")).toBeNull();
  });
});

describe("auth gate", () => {
  it("redirects without a valid session", async () => {
    expect(getRedirectUrl(await authGate(req("/proxy/members"), "k1"))).toBe(`${BASE}/proxy?signin=required#auth`);
    expect(getRedirectUrl(await authGate(req("/proxy/members", { cookies: { [SESSION_COOKIE]: "forged" } }), "k1"))).toBe(`${BASE}/proxy?signin=required#auth`);
  });

  it("fails closed when SESSION_SECRET is missing", async () => {
    expect(getRedirectUrl(await authGate(req("/proxy/members"), undefined))).toBe(`${BASE}/proxy?signin=unavailable#auth`);
  });

  it("lets a valid session through", async () => {
    const token = await createSession("Ada", "k1");
    const res = await authGate(req("/proxy/members", { cookies: { [SESSION_COOKIE]: token } }), "k1");
    expect(getRedirectUrl(res)).toBeNull();
    expect(isRewrite(res)).toBe(false);
  });
});

describe("visitor id", () => {
  it("gives a first visit an id, visible to this request and saved in a cookie", () => {
    const res = ensureVisitor(req("/edge-config"));
    const id = res.cookies.get(VISITOR_COOKIE)?.value;
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(res.headers.get("x-middleware-request-cookie")).toContain(`${VISITOR_COOKIE}=${id}`);
  });

  it("leaves an existing id alone", () => {
    const res = ensureVisitor(req("/edge-config", { cookies: { [VISITOR_COOKIE]: "abc" } }));
    expect(res.cookies.get(VISITOR_COOKIE)).toBeUndefined();
  });
});

describe("cookie flags", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("marks the A/B and visitor cookies Secure in production only", () => {
    const flags = () => [abTest(req("/proxy/ab")).cookies.get(AB_COOKIE), ensureVisitor(req("/edge-config")).cookies.get(VISITOR_COOKIE)];
    for (const cookie of flags()) expect(cookie).toMatchObject({ httpOnly: true, sameSite: "lax", secure: false });
    vi.stubEnv("NODE_ENV", "production");
    for (const cookie of flags()) expect(cookie).toMatchObject({ httpOnly: true, sameSite: "lax", secure: true });
  });
});

describe("proxy", () => {
  it("overwrites spoofed lab headers and reports the rule it ran", async () => {
    const res = withProxyHeaders(req("/proxy", { headers: { "x-lab-country": "spoofed", "x-vercel-ip-country": "ZA" } }));
    expect(res.headers.get("x-middleware-request-x-lab-country")).toBe("ZA");
    const full = await proxy(req("/proxy/geo"));
    expect(full.headers.get("x-lab-proxy")).toMatch(/^geo; \d+\.\d{2}ms$/);
  });
});
