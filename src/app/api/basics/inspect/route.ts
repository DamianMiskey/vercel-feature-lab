import { requestInfo } from "@/lib/request-info";

// A route handler receives a standard Web Request and returns a Response,
// much like a Cloudflare Worker. On Vercel it runs as a serverless function.
export function GET(request: Request) {
  return Response.json({
    method: request.method,
    url: request.url,
    ...requestInfo(request.headers),
    runtime: {
      node: process.version,
      // System environment variables Vercel sets at runtime.
      vercelEnv: process.env.VERCEL_ENV ?? "local",
      region: process.env.VERCEL_REGION ?? "local",
    },
  });
}
