import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, readSession } from "@/lib/session";

// The rules src/proxy.ts applies, kept here so each one can be tested alone.

export const AB_COOKIE = "lab-ab";
export const VARIANTS = ["a", "b"] as const;
export type Variant = (typeof VARIANTS)[number];
const isVariant = (v: string | null | undefined): v is Variant => VARIANTS.includes(v as Variant);

// Two-letter country from Vercel's geo header. `?country=JP` overrides it so
// the demo can be tried locally, where there is no header. Anything else
// becomes "XX", so random values can't create new cached pages.
export function visitorCountry(request: NextRequest) {
  const raw = (request.nextUrl.searchParams.get("country") ?? request.headers.get("x-vercel-ip-country") ?? "").toUpperCase();
  return /^[A-Z]{2}$/.test(raw) ? raw : "XX";
}

// A/B test: keep the visitor's bucket from the cookie, or pick one at random.
// `?variant=b` switches bucket. The URL stays /proxy/ab; only the page served changes.
export function abTest(request: NextRequest, random = Math.random) {
  const forced = request.nextUrl.searchParams.get("variant");
  const saved = request.cookies.get(AB_COOKIE)?.value;
  const variant: Variant = isVariant(forced) ? forced : isVariant(saved) ? saved : random() < 0.5 ? "a" : "b";
  const response = NextResponse.rewrite(new URL(`/proxy/ab/${variant}`, request.url));
  if (variant !== saved) {
    response.cookies.set(AB_COOKIE, variant, { path: "/proxy", maxAge: 60 * 60 * 24 * 30, httpOnly: true, sameSite: "lax" });
  }
  return response;
}

// Geo routing: serve the page for the visitor's country under the same URL.
export function geoRewrite(request: NextRequest) {
  return NextResponse.rewrite(new URL(`/proxy/geo/${visitorCountry(request)}`, request.url));
}

// Auth gate: an optimistic check before the page runs. Without a valid
// session cookie the visitor is sent back to sign in. The page checks again:
// Proxy is a fast first filter, not the only line of defence.
export async function authGate(request: NextRequest, secret = process.env.SESSION_SECRET) {
  const back = (reason: string) => NextResponse.redirect(new URL(`/proxy?signin=${reason}#auth`, request.url));
  if (!secret) return back("unavailable");
  const session = await readSession(request.cookies.get(SESSION_COOKIE)?.value, secret);
  return session ? NextResponse.next() : back("required");
}

// Everything else: pass the request on, adding headers the page can read.
// set() overwrites, so a client can't spoof these by sending them itself.
export function withProxyHeaders(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-lab-country", visitorCountry(request));
  headers.set("x-lab-proxy-at", new Date().toISOString());
  return NextResponse.next({ request: { headers } });
}
