import { redis, redisConfigured } from "@/lib/redis";

// CSP violation reports, sent by browsers to /api/security/csp-report. Two
// formats exist: the older report-uri one ({ "csp-report": {...} }) and the
// Reporting API one ([{ type: "csp-violation", body: {...} }]).

export type Violation = { at: string; directive: string; blocked: string; page: string; sample: string };

const KEY = "lab:csp:reports";
const clip = (value: unknown, max: number) => (typeof value === "string" ? value.slice(0, max) : "");

// Keeps only a few short, known fields: reports come from browsers, so their
// content is untrusted and could be anything.
export function normalizeReports(payload: unknown, now = new Date()): Violation[] {
  const items: Record<string, unknown>[] = [];
  if (Array.isArray(payload)) {
    for (const r of payload) {
      if (r && typeof r === "object" && (r as { type?: unknown }).type === "csp-violation") {
        const body = (r as { body?: unknown }).body;
        if (body && typeof body === "object") items.push(body as Record<string, unknown>);
      }
    }
  } else if (payload && typeof payload === "object" && "csp-report" in payload) {
    const body = (payload as Record<string, unknown>)["csp-report"];
    if (body && typeof body === "object") items.push(body as Record<string, unknown>);
  }
  return items.slice(0, 5).map((b) => ({
    at: now.toISOString(),
    directive: clip(b.effectiveDirective ?? b["effective-directive"] ?? b["violated-directive"], 60),
    blocked: clip(b.blockedURL ?? b["blocked-uri"], 120),
    page: clip(b.documentURL ?? b["document-uri"], 120),
    sample: clip(b.sample ?? b["script-sample"], 80),
  }));
}

export async function saveViolations(violations: Violation[]) {
  if (!redisConfigured() || violations.length === 0) return;
  await redis().pipeline().lpush(KEY, ...violations.map((v) => JSON.stringify(v))).ltrim(KEY, 0, 9).exec();
}

export async function recentViolations(): Promise<Violation[]> {
  return redisConfigured() ? redis().lrange<Violation>(KEY, 0, 9) : [];
}
