import { revalidateTag } from "next/cache";
import { ON_DEMAND_TAG, isAuthorized } from "@/lib/revalidate";

// Revalidation webhook, as a CMS would call it after publishing:
//   curl -X POST https://<host>/api/static/revalidate -H "Authorization: Bearer $REVALIDATE_SECRET"
// revalidateTag(tag, "max") marks the entry stale: the next visitor still gets
// the cached copy while a fresh one is built in the background.
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return Response.json({ error: "REVALIDATE_SECRET is not configured" }, { status: 503 });
  if (!isAuthorized(request.headers.get("authorization"), secret)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  revalidateTag(ON_DEMAND_TAG, "max");
  return Response.json({ revalidated: true, tag: ON_DEMAND_TAG, at: new Date().toISOString() });
}
