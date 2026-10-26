import { expect, test } from "@playwright/test";
import { DEPLOYED, PAGES } from "./helpers";

// What next.config.ts, src/proxy.ts and vercel.json promise, checked on real
// responses.

test.describe("security headers", () => {
  for (const path of PAGES) {
    test(`${path}`, async ({ request }) => {
      const res = await request.get(path);
      const h = res.headers();
      expect(h["strict-transport-security"]).toContain("max-age=31536000");
      expect(h["x-content-type-options"]).toBe("nosniff");
      expect(h["x-frame-options"]).toBe("DENY");
      expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
      expect(h["permissions-policy"]).toContain("camera=()");
      expect(h["x-powered-by"]).toBeUndefined();
      const csp = h["content-security-policy"];
      if (path === "/security") {
        // The strict policy from Proxy: a fresh nonce on every request.
        const scriptSrc = csp.split(";").find((d) => d.trim().startsWith("script-src"))!;
        expect(scriptSrc).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'sha256-[A-Za-z0-9+/=]+' 'strict-dynamic'/);
        expect(scriptSrc).not.toContain("'unsafe-inline'");
      } else {
        expect(csp).toContain("default-src 'self'");
        expect(csp).toContain("frame-ancestors 'none'");
        expect(csp).not.toContain("'unsafe-eval'");
      }
    });
  }

  test("the /security nonce changes on every request", async ({ request }) => {
    const nonce = async () => (await request.get("/security")).headers()["content-security-policy"].match(/'nonce-([^']+)'/)![1];
    expect(await nonce()).not.toBe(await nonce());
  });

  test("uploaded files are served sandboxed", async ({ request }) => {
    const res = await request.get("/api/blob/00000000-0000-0000-0000-000000000000.png");
    expect(res.status()).toBeGreaterThanOrEqual(400); // no session, or no such file
    expect(res.headers()["content-security-policy"]).toBe("default-src 'none'; sandbox");
  });
});

test.describe("Proxy", () => {
  test("labels the responses it handles", async ({ request }) => {
    expect((await request.get("/proxy")).headers()["x-lab-proxy"]).toMatch(/^headers; [\d.]+ms$/);
    expect((await request.get("/")).headers()["x-lab-proxy"]).toBeUndefined(); // outside the matcher
  });

  test("the A/B test is sticky through an httpOnly cookie", async ({ page }) => {
    await page.goto("/proxy/ab");
    const first = await page.locator("h1").first().innerText();
    const cookie = (await page.context().cookies()).find((c) => c.name === "lab-ab");
    expect(cookie?.httpOnly).toBe(true);
    for (let i = 0; i < 3; i++) {
      await page.reload();
      await expect(page.locator("h1").first()).toHaveText(first);
    }
  });

  test("/edge-config gives each visitor an id cookie", async ({ page }) => {
    await page.goto("/edge-config");
    const cookie = (await page.context().cookies()).find((c) => c.name === "lab-visitor");
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.path).toBe("/edge-config");
  });

  test("the members area sends visitors without a session back to sign in", async ({ page }) => {
    await page.goto("/proxy/members");
    await expect(page).toHaveURL(/\/proxy\?signin=/);
  });
});

test.describe("API routes", () => {
  test("health check", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBe(true);
    expect(await res.json()).toMatchObject({ ok: true });
  });

  // Without the secret configured they answer 503; with it, 401 for a wrong
  // or missing bearer token. A deployment must have the secret.
  test("the cron route refuses requests without CRON_SECRET", async ({ request }) => {
    const res = await request.get("/api/cron/cleanup", { headers: { authorization: "Bearer wrong" } });
    expect(DEPLOYED ? [401] : [401, 503]).toContain(res.status());
  });

  test("the revalidation webhook refuses requests without REVALIDATE_SECRET", async ({ request }) => {
    const res = await request.post("/api/static/revalidate", { headers: { authorization: "Bearer wrong" } });
    expect(DEPLOYED ? [401] : [401, 503]).toContain(res.status());
  });

  test("the AI route rejects malformed input", async ({ request }) => {
    const res = await request.post("/api/ai/chat", { data: { messages: "nope" } });
    expect(res.status()).toBe(400);
  });
});

// Only a Vercel deployment has these.
test.describe("on Vercel @deployed", () => {
  test("the Firewall denies scanner paths", async ({ request }) => {
    for (const path of ["/wp-admin", "/wp-login.php", "/.env", "/.git/config", "/phpmyadmin"]) {
      expect((await request.get(path, { maxRedirects: 0 })).status(), path).toBe(403);
    }
  });

  test("responses come through Vercel's network", async ({ request }) => {
    expect((await request.get("/api/health")).headers()["x-vercel-id"]).toBeTruthy();
  });

  test("BotID refuses a scripted request", async ({ request }) => {
    const res = await request.post("/api/security/botid");
    expect(res.status()).toBe(403);
    expect(await res.json()).toMatchObject({ isBot: true });
  });

  test("the .vercel.app address redirects to the custom domain", async ({ request }) => {
    test.skip(!process.env.BASE_URL?.includes("vercel.djmiskey.com"), "production only");
    const res = await request.get("https://vercel-feature-lab.vercel.app/basics", { maxRedirects: 0 });
    expect(res.status()).toBe(308);
    expect(res.headers().location).toBe("https://vercel.djmiskey.com/basics");
  });
});
