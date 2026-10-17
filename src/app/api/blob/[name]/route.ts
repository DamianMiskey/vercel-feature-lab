import { get } from "@vercel/blob";
import { currentSession } from "@/lib/current-session";
import { UPLOAD_PREFIX, blobConfigured, isUploadName } from "@/lib/uploads";

// Serves a private blob. The store has no public URLs, so every file goes
// through this function, which decides who may see it: here, anyone with a
// lab session. This is where per-user permissions would go.
export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!isUploadName(name)) return new Response("Not found", { status: 404 });
  if (!blobConfigured()) return new Response("Blob isn't connected", { status: 503 });
  if (!(await currentSession())) return new Response("Sign in to view uploads", { status: 401 });

  const result = await get(`${UPLOAD_PREFIX}${name}`, { access: "private" });
  if (!result || result.statusCode !== 200 || !result.stream) return new Response("Not found", { status: 404 });

  return new Response(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType ?? "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      // The sandboxing Content-Security-Policy for these files is set in
      // next.config.ts, because config headers override a route's own.
      // Private: only this visitor's browser may cache it, not Vercel's CDN.
      "Cache-Control": "private, max-age=300",
    },
  });
}
