import type { NextRequest } from "next/server";
import { abTest, authGate, geoRewrite, withProxyHeaders } from "@/lib/proxy-rules";

// Proxy (called Middleware before Next.js 16) runs before the route, on every
// request the matcher selects. On Vercel it runs as a Vercel Function, on the
// Node.js runtime by default. Keep it fast: it sits in front of every page it matches.
export async function proxy(request: NextRequest) {
  const started = performance.now();
  const { pathname } = request.nextUrl;

  const [rule, response] =
    pathname === "/proxy/ab" ? ["ab-test", abTest(request)] as const
    : pathname === "/proxy/geo" ? ["geo", geoRewrite(request)] as const
    : pathname.startsWith("/proxy/members") ? ["auth-gate", await authGate(request)] as const
    : ["headers", withProxyHeaders(request)] as const;

  // A response header, visible in the browser's network tab.
  response.headers.set("x-lab-proxy", `${rule}; ${(performance.now() - started).toFixed(2)}ms`);
  return response;
}

// Only the lab's Proxy pages go through Proxy. Without a matcher it would run
// on every request, static files included.
export const config = {
  matcher: ["/proxy/:path*"],
};
