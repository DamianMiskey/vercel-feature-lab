import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isSimulated, lastUserText, simulatedAnswer } from "@/lib/ai-model";

const { POST: chat } = await import("@/app/api/ai/chat/route");

const userMessage = (text: string, id = "m1") => ({ id, role: "user", parts: [{ type: "text", text }] });
const post = (body: unknown) =>
  chat(new Request("https://vercel.djmiskey.com/api/ai/chat", { method: "POST", body: JSON.stringify(body) }));

describe("simulated model helpers", () => {
  it("finds the newest user text in a model prompt", () => {
    expect(lastUserText([
      { role: "system", content: "be brief" },
      { role: "user", content: [{ type: "text", text: "first" }] },
      { role: "assistant", content: [{ type: "text", text: "reply" }] },
      { role: "user", content: [{ type: "text", text: "second" }] },
    ])).toBe("second");
    expect(lastUserText([])).toBe("");
  });

  it("says it's simulated and echoes a shortened question", () => {
    expect(simulatedAnswer("hi")).toContain("simulated reply");
    expect(simulatedAnswer("x".repeat(500))).toContain(`${"x".repeat(117)}…`);
  });
});

describe("POST /api/ai/chat (simulated)", () => {
  // Redis unconfigured, so the rate limit fails open; AI_MODEL unset, so no provider is called.
  beforeEach(() => {
    for (const k of ["KV_REST_API_URL", "KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN", "AI_MODEL"]) vi.stubEnv(k, "");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("is simulated unless AI_MODEL is set", () => {
    expect(isSimulated()).toBe(true);
  });

  it("rejects malformed and over-long input", async () => {
    expect((await post({ messages: "nope" })).status).toBe(400);
    expect((await post({ messages: [userMessage("x".repeat(501))] })).status).toBe(413);
  });

  it("streams the simulated answer as a UI message stream", async () => {
    const res = await post({ messages: [userMessage("What is Vercel?")] });
    expect(res.status).toBe(200);
    // Server-sent events: one JSON chunk per `data:` line.
    const chunks = (await res.text()).split("\n").filter((l) => l.startsWith("data: {")).map((l) => JSON.parse(l.slice(6)));
    const text = chunks.filter((c) => c.type === "text-delta").map((c) => c.delta).join("");
    expect(text).toContain("This is a simulated reply");
    expect(text).toContain("What is Vercel?");
  });
});
