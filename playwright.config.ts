import { defineConfig, devices } from "@playwright/test";

// End-to-end tests (e2e/). By default they start the production build
// (`npm start`, so run `npm run build` first) and test it; set BASE_URL to
// test a deployment instead, which also runs the tests tagged @deployed
// (Firewall, redirects, BotID, live data: things only Vercel provides):
//   BASE_URL=https://vercel.djmiskey.com npm run e2e
// Every test is read-only: previews and production share one Neon database,
// so the suite never writes notes, uploads or counters.
// Locally the browser is the installed Microsoft Edge; CI installs Chromium.
const CI = !!process.env.CI;
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3200";
const channel = CI ? undefined : "msedge";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  workers: CI ? 2 : undefined,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: { baseURL: BASE_URL, trace: "retain-on-failure" },
  // Without a deployment, skip what only Vercel can do.
  grepInvert: process.env.BASE_URL ? undefined : /@deployed/,
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel } },
    { name: "mobile", use: { ...devices["Pixel 7"], channel }, testMatch: /pages\.spec/ },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : { command: "npm start -- -p 3200", url: BASE_URL, reuseExistingServer: !CI, timeout: 60_000 },
});
