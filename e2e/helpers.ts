import type { Page } from "@playwright/test";
import { features } from "@/lib/features";

// Every feature page, plus the Proxy demo's sub-pages.
export const PAGES = ["/", ...features.filter((f) => f.ready).map((f) => `/${f.slug}`), "/proxy/ab", "/proxy/geo"];

/** True when the tests run against a Vercel deployment (BASE_URL set). */
export const DEPLOYED = !!process.env.BASE_URL;

// Web Analytics and Speed Insights load their scripts from /_vercel/…, which
// only exists on Vercel. Off Vercel those requests 404; on a deployment they
// must not.
const offVercelOnly = (url: string) => !DEPLOYED && /\/_vercel\/(insights|speed-insights)\//.test(url);

/**
 * Collects uncaught exceptions, console errors (CSP violations included) and
 * failed requests. The browser's own "Failed to load resource" message has no
 * URL, so failed requests are recorded from the responses instead.
 */
export function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`exception: ${e.message}`));
  page.on("response", (r) => {
    if (r.status() >= 400 && !offVercelOnly(r.url())) errors.push(`${r.status()}: ${r.url()}`);
  });
  page.on("console", (m) => {
    const text = m.text();
    if (m.type() !== "error" || text.startsWith("Failed to load resource")) return;
    if (!DEPLOYED && text.includes("/_vercel/")) return;
    errors.push(`console: ${text}`);
  });
  return errors;
}

/** Scrolls to the bottom and waits for streamed sections and requests to settle. */
export async function settle(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight / 2) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }
  });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);
}

/**
 * How far the page is wider than the device. Not scrollWidth - innerWidth:
 * on a phone the browser widens its layout viewport to fit too-wide content,
 * which would hide the very overflow being measured.
 */
export async function overflow(page: Page) {
  const width = page.viewportSize()!.width;
  return (await page.evaluate(() => document.documentElement.scrollWidth)) - width;
}
