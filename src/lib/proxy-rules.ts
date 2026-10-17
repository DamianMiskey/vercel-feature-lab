import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, readSession } from "@/lib/session";

// The rules src/proxy.ts applies, kept here so each one can be tested alone.

// Cookie options shared by the rules, matching the session cookie: no
// JavaScript access, and HTTPS-only in production (off locally, so
// http://localhost still works).
const cookieOptions = () => ({ httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production" });

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
    response.cookies.set(AB_COOKIE, variant, { ...cookieOptions(), path: "/proxy", maxAge: 60 * 60 * 24 * 30 });
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

// Feature flags need a stable id per visitor to roll out to a percentage.
// A first visit gets a random one, set on the response and also on this
// request, so the page that's about to render sees it straight away.
export const VISITOR_COOKIE = "lab-visitor";

export function ensureVisitor(request: NextRequest) {
  if (request.cookies.has(VISITOR_COOKIE)) return NextResponse.next();
  const id = crypto.randomUUID();
  request.cookies.set(VISITOR_COOKIE, id);
  const response = NextResponse.next({ request: { headers: request.headers } });
  response.cookies.set(VISITOR_COOKIE, id, { ...cookieOptions(), path: "/edge-config", maxAge: 60 * 60 * 24 * 365 });
  return response;
}

// Everything else: pass the request on, adding headers the page can read.
// set() overwrites, so a client can't spoof these by sending them itself.
export function withProxyHeaders(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-lab-country", visitorCountry(request));
  headers.set("x-lab-proxy-at", new Date().toISOString());
  return NextResponse.next({ request: { headers } });
}

// Strict Content Security Policy for /security: a fresh nonce per request,
// so only scripts the server rendered (and scripts they load, thanks to
// 'strict-dynamic') can run. Next.js reads the nonce from the request's CSP
// header and adds it to its own scripts. Nonces only work on pages rendered
// per request, which is why the rest of the lab (prerendered) uses the
// site-wide policy in next.config.ts instead.
export function strictCsp(nonce: string, isDev = process.env.NODE_ENV === "development") {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'report-sample'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
    // report-uri sends each violation straight away. (Its successor, report-to,
    // batches reports for up to a minute and, when present, replaces it in
    // Chromium, which is too slow for a live demo.)
    "report-uri /api/security/csp-report",
  ].join("; ");
}

export function withStrictCsp(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const policy = strictCsp(nonce);
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("content-security-policy", policy);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", policy);
  return response;
}
