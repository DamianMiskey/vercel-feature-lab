import { describe, expect, it } from "vitest";
import { cloudflarePages, onlyOnCloudflare, rows } from "@/lib/comparison";
import { deploymentInfo } from "@/lib/deployment";
import { features } from "@/lib/features";

describe("comparison table", () => {
  it("links only to ready pages in this lab", () => {
    const ready = new Set(features.filter((f) => f.ready).map((f) => f.slug));
    for (const r of rows) for (const s of r.vercel) expect(ready.has(s), `${r.job} → /${s}`).toBe(true);
  });

  it("names every Cloudflare page it links to", () => {
    for (const s of [...rows.flatMap((r) => r.cloudflare), ...onlyOnCloudflare]) expect(cloudflarePages[s], s).toBeTruthy();
  });

  it("covers every page in this lab except itself", () => {
    const linked = new Set(rows.flatMap((r) => r.vercel));
    const missing = features.filter((f) => f.ready && f.slug !== "vs-cloudflare" && !linked.has(f.slug)).map((f) => f.slug);
    expect(missing).toEqual([]);
  });
});

describe("deploymentInfo", () => {
  it("describes a preview deployment from Vercel's system variables", () => {
    expect(deploymentInfo({
      VERCEL_ENV: "preview", VERCEL_GIT_COMMIT_REF: "feature-x", VERCEL_GIT_COMMIT_SHA: "abcdef1234567",
      VERCEL_GIT_COMMIT_MESSAGE: "Add a thing\n\nlong body", VERCEL_URL: "lab-abc.vercel.app", VERCEL_REGION: "iad1",
    })).toMatchObject({
      environment: "preview", branch: "feature-x", commit: "abcdef1", commitMessage: "Add a thing",
      deploymentUrl: "https://lab-abc.vercel.app", region: "iad1",
    });
  });

  it("says local when not on Vercel", () => {
    expect(deploymentInfo({})).toMatchObject({ environment: "local", branch: null, region: "local" });
  });
});
