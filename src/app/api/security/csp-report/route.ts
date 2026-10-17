import { normalizeReports, saveViolations } from "@/lib/csp-reports";
import { checkLimit, reportLimit } from "@/lib/redis";

// Browsers POST here when the /security page's CSP blocks something.
// Always answers 204: a report endpoint shouldn't tell anyone anything.
export async function POST(request: Request) {
  const limit = await checkLimit(reportLimit);
  if (limit && !limit.success) return new Response(null, { status: 204 });
  const text = await request.text();
  if (text.length > 16_000) return new Response(null, { status: 204 });
  try {
    await saveViolations(normalizeReports(JSON.parse(text)));
  } catch {
    // Not JSON: ignore.
  }
  return new Response(null, { status: 204 });
}
