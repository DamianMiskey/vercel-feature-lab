import { readFileSync } from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { describe, expect, it } from "vitest";
import { normalizeReports } from "@/lib/csp-reports";
import { createHash } from "node:crypto";
import { THEME_SCRIPT } from "@djmiskey/lab-tokens/theme-script";
import { strictCsp, THEME_SCRIPT_HASH, withStrictCsp } from "@/lib/proxy-rules";
import { config } from "@/proxy";

describe("strict CSP", () => {
  it("allows only nonce'd scripts, with no unsafe-inline", () => {
    const policy = strictCsp("abc123", false);
    expect(policy).toContain(`script-src 'self' 'nonce-abc123' ${THEME_SCRIPT_HASH} 'strict-dynamic'`);
    expect(policy).not.toMatch(/script-src[^;]*unsafe-inline/);
    expect(policy).not.toContain("unsafe-eval");
    expect(strictCsp("abc123", true)).toContain("'unsafe-eval'");
  });

  it("allows the shared theme script by the hash of its exact text", () => {
    const hash = createHash("sha256").update(THEME_SCRIPT).digest("base64");
    expect(THEME_SCRIPT_HASH).toBe(`'sha256-${hash}'`);
    expect(strictCsp("abc123", false)).toContain(THEME_SCRIPT_HASH);
  });

  it("gives every request a fresh nonce, passed to the page and the browser", () => {
    const one = withStrictCsp(new NextRequest("https://vercel.djmiskey.com/security"));
    const two = withStrictCsp(new NextRequest("https://vercel.djmiskey.com/security"));
    const nonce = one.headers.get("x-middleware-request-x-nonce");
    expect(nonce).toBeTruthy();
    expect(nonce).not.toBe(two.headers.get("x-middleware-request-x-nonce"));
    expect(one.headers.get("content-security-policy")).toContain(`'nonce-${nonce}'`);
  });

  it("runs Proxy on /security", () => {
    expect(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url: "/security" })).toBe(true);
    // The challenge page is prerendered, so it keeps the site-wide policy instead.
    expect(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url: "/security/challenge" })).toBe(false);
    expect(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url: "/api/security/csp-report" })).toBe(false);
  });
});

describe("CSP reports", () => {
  const now = new Date("2026-10-17T12:00:00Z");

  it("reads the report-uri format", () => {
    expect(normalizeReports({ "csp-report": { "effective-directive": "script-src-elem", "blocked-uri": "inline", "document-uri": "https://x/security", "script-sample": "window.__lab" } }, now))
      .toEqual([{ at: now.toISOString(), directive: "script-src-elem", blocked: "inline", page: "https://x/security", sample: "window.__lab" }]);
  });

  it("reads the Reporting API format and ignores other report types", () => {
    const reports = normalizeReports([
      { type: "csp-violation", body: { effectiveDirective: "script-src-elem", blockedURL: "inline", documentURL: "https://x/security" } },
      { type: "deprecation", body: { id: "x" } },
    ], now);
    expect(reports).toHaveLength(1);
    expect(reports[0]).toMatchObject({ directive: "script-src-elem", blocked: "inline" });
  });

  it("clips long values and caps the number of reports", () => {
    const many = Array.from({ length: 20 }, () => ({ type: "csp-violation", body: { blockedURL: "x".repeat(1000) } }));
    const reports = normalizeReports(many, now);
    expect(reports).toHaveLength(5);
    expect(reports[0].blocked).toHaveLength(120);
    expect(normalizeReports("junk", now)).toEqual([]);
  });
});

describe("firewall rules", () => {
  it("vercel.json denies scanner paths and challenges the demo path", () => {
    const routes = JSON.parse(readFileSync(path.join(__dirname, "..", "vercel.json"), "utf8")).routes as { src: string; mitigate: { action: string } }[];
    const action = (url: string) => routes.find((r) => new RegExp(`^${r.src}$`).test(url))?.mitigate.action;
    expect(action("/wp-admin")).toBe("deny");
    expect(action("/wp-admin/setup.php")).toBe("deny");
    expect(action("/.env")).toBe("deny");
    expect(action("/.git/config")).toBe("deny");
    expect(action("/security/challenge")).toBe("challenge");
    expect(action("/security")).toBeUndefined();
    expect(action("/wp-admin-guide")).toBeUndefined();
  });
});
