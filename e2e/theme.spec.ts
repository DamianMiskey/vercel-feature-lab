import { expect, test } from "@playwright/test";

// The shared theme switch (@djmiskey/lab-tokens), styled here by its plain
// CSS: a choice survives a reload, applied before the page draws.
test("a chosen theme survives a reload @readonly", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  const theme = () => page.evaluate(() => document.documentElement.dataset.theme);
  const bg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(await theme()).toBe("light");
  const light = await bg();
  const dark = page.getByRole("group", { name: "Colour theme" }).getByRole("button", { name: "Dark" });
  await dark.click();
  expect(await theme()).toBe("dark");
  expect(await bg()).not.toBe(light);
  // Styled without Tailwind: the pressed option carries the accent.
  expect(await dark.evaluate((el) => getComputedStyle(el).backgroundColor)).not.toBe("rgba(0, 0, 0, 0)");
  await page.reload({ waitUntil: "domcontentloaded" });
  expect(await theme()).toBe("dark");
});
