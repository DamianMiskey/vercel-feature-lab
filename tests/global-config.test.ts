import { describe, expect, it } from "vitest";
import { bucketOf, rolloutPercent } from "@/lib/global-config";

describe("rolloutPercent", () => {
  it("reads the percentage and clamps it to 0–100", () => {
    expect(rolloutPercent({ rollout: { "new-hero": 25 } }, "new-hero")).toBe(25);
    expect(rolloutPercent({ rollout: { "new-hero": 250 } }, "new-hero")).toBe(100);
    expect(rolloutPercent({ rollout: { "new-hero": -5 } }, "new-hero")).toBe(0);
  });

  it("treats a missing or malformed value as off", () => {
    expect(rolloutPercent({}, "new-hero")).toBe(0);
    expect(rolloutPercent({ rollout: { "new-hero": "50" as unknown as number } }, "new-hero")).toBe(0);
  });
});

describe("bucketOf", () => {
  it("is stable for a visitor and differs per flag", () => {
    expect(bucketOf("visitor-1", "new-hero")).toBe(bucketOf("visitor-1", "new-hero"));
    const ids = Array.from({ length: 50 }, (_, i) => `visitor-${i}`);
    expect(ids.some((id) => bucketOf(id, "new-hero") !== bucketOf(id, "other-flag"))).toBe(true);
  });

  it("spreads visitors roughly evenly, so 25% means about a quarter", () => {
    const n = 10_000;
    const inRollout = Array.from({ length: n }, () => bucketOf(crypto.randomUUID(), "new-hero")).filter((b) => b < 25).length;
    expect(inRollout / n).toBeGreaterThan(0.22);
    expect(inRollout / n).toBeLessThan(0.28);
  });
});
