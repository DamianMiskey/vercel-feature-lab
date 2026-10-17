import { type CleanupRun, cleanUp, recordRun } from "@/lib/housekeeping";
import { isAuthorized } from "@/lib/revalidate";
import { timed } from "@/lib/timed";

// Called by Vercel Cron (see vercel.json) with a GET request and
// `Authorization: Bearer $CRON_SECRET`. The URL is public, so the secret is
// what stops anyone else from triggering it.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return Response.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
  if (!isAuthorized(request.headers.get("authorization"), secret)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { value, ms } = await timed(() => cleanUp());
  const run: CleanupRun = {
    at: new Date().toISOString(),
    // Vercel's scheduler identifies itself; anything else is a manual trigger.
    trigger: request.headers.get("user-agent")?.startsWith("vercel-cron") ? "schedule" : "manual",
    ...value,
    ms: Math.round(ms),
  };
  await recordRun(run);
  return Response.json(run);
}
