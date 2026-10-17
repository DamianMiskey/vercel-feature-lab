import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { features } from "@/lib/features";
import { SITE_URL } from "@/lib/site";

describe("robots.txt", () => {
  it("opens feature pages, closes API and demo-only routes, points at the sitemap", () => {
    const r = robots();
    const rule = Array.isArray(r.rules) ? r.rules[0] : r.rules;
    expect(rule.allow).toBe("/");
    expect(rule.disallow).toEqual(expect.arrayContaining(["/api/", "/proxy/members"]));
    // No feature page is accidentally blocked.
    for (const f of features.filter((f) => f.ready)) {
      expect((rule.disallow as string[]).some((d) => `/${f.slug}`.startsWith(d)), f.slug).toBe(false);
    }
    expect(r.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
  });
});

describe("sitemap.xml", () => {
  it("lists the home page and every ready feature on the custom domain", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls[0]).toBe(SITE_URL);
    expect(urls).toHaveLength(1 + features.filter((f) => f.ready).length);
    expect(urls.every((u) => u.startsWith(`${SITE_URL}`))).toBe(true);
  });
});
