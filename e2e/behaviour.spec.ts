import { expect, test } from "@playwright/test";
import { DEPLOYED } from "./helpers";

// Features driven the way a visitor would. All read-only: nothing here signs
// the guestbook, uploads a file or spends a rate limit someone else shares.

test("streaming: every Suspense boundary on /streaming resolves", async ({ page }) => {
  await page.goto("/streaming");
  // Fallbacks ("streaming…") are rendered at build time; each is replaced as
  // its data arrives.
  await expect(page.getByText("streaming…", { exact: true })).toHaveCount(0, { timeout: 15_000 });
});

test("streaming: the route handler streams lines into the page", async ({ page }) => {
  await page.goto("/streaming");
  await page.getByRole("button", { name: "Start stream" }).click();
  await expect(page.locator("pre.json")).toBeVisible();
  await expect(page.getByRole("button", { name: "Start stream" })).toBeEnabled({ timeout: 15_000 });
  expect((await page.locator("pre.json").innerText()).split("\n").length).toBeGreaterThan(1);
});

test("AI: the simulated model streams a reply", async ({ page }) => {
  await page.goto("/ai");
  await page.getByLabel("Message").fill("What does streamText do?");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.locator(".chat-log")).toContainText("You:");
  await expect(page.locator(".chat-log")).toContainText("Lab:", { timeout: 15_000 });
  await expect(page.getByRole("button", { name: "Send" })).toBeVisible({ timeout: 15_000 });
});

test("Proxy: signing in opens the members area", async ({ page }) => {
  await page.goto("/proxy");
  await page.getByLabel("Name").fill("Playwright");
  await page.getByRole("button", { name: "Sign in" }).click();
  // The Server Action redirects to the members area, or back with a notice.
  await page.waitForURL(/\/proxy\/members|signin=/);
  if (page.url().includes("signin=unavailable")) {
    // No SESSION_SECRET here (CI): the page must say so instead of failing.
    test.skip(DEPLOYED, "a deployment must have SESSION_SECRET");
    await expect(page.getByText("Sign-in is switched off")).toBeVisible();
    return;
  }
  await page.goto("/proxy/members");
  await expect(page).toHaveURL(/\/proxy\/members/);
  await expect(page.getByText("Playwright")).toBeVisible();
  const session = (await page.context().cookies()).find((c) => c.name === "lab-session");
  expect(session?.httpOnly).toBe(true);
});

test.describe("live data @deployed", () => {
  // On a deployment every service is connected: no error message may show,
  // apart from the "sign in first" notes for visitors without a session.
  for (const path of ["/postgres", "/redis", "/blob", "/edge-config"]) {
    test(`${path} is connected`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await expect(page.locator(".error").filter({ hasNotText: /lab session/ })).toHaveCount(0);
    });
  }

  test("/observability knows which deployment it is", async ({ page }) => {
    await page.goto("/observability");
    await expect(page.getByText(/production|preview/).first()).toBeVisible();
  });
});
