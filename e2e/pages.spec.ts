import { expect, test } from "@playwright/test";
import { overflow, PAGES, settle, watchErrors } from "./helpers";

// Every page, on desktop and on a phone: it answers 200, streams in fully,
// nothing throws or gets blocked by the CSP, and nothing is wider than the
// screen. In CI there are no secrets or services, so this also proves each
// page degrades gracefully when its database, store or key is missing.
for (const path of PAGES) {
  test(`${path} loads cleanly`, async ({ page }) => {
    const errors = watchErrors(page);
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1").first()).toBeVisible();
    await settle(page);
    if (path === "/security") {
      // The page's own demo: an "injected" inline script without the nonce,
      // which the strict CSP must block (and report).
      await expect(page.getByText("blocked by CSP")).toBeVisible();
      const blocked = errors.filter((e) => e.includes("Content Security Policy"));
      expect(blocked).toHaveLength(1);
      errors.splice(0, errors.length, ...errors.filter((e) => !blocked.includes(e)));
    }
    expect(errors).toEqual([]);
    expect(await overflow(page), "page is wider than the screen").toBeLessThanOrEqual(0);
  });
}
