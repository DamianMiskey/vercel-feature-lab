import { withBotId } from "botid/next/config";
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Site-wide Content Security Policy. The lab's pages are prerendered (Partial
// Prerendering), and Next.js puts inline <script> tags in prerendered HTML,
// so script-src must allow 'unsafe-inline' here: a nonce can't be baked into
// a page built ahead of time. Everything else is locked to this site. The
// /security page shows the strict, nonce-based alternative (src/proxy.ts).
const sitePolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

// Security headers for every response.
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  // Cache Components: Partial Prerendering by default, plus "use cache".
  cacheComponents: true,
  // Don't advertise the framework in an X-Powered-By header.
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Everywhere except /security itself, which gets a per-request nonce
      // policy from Proxy (two CSP headers would both apply, so it's excluded).
      { source: "/:path((?!security$).*)", headers: [{ key: "Content-Security-Policy", value: sitePolicy }] },
      // Uploaded files (Blob demo): even if one weren't the image it claims to
      // be, opening it directly couldn't run scripts or load anything. Config
      // headers override a route's own, and the later rule wins, so this
      // stricter policy has to live here, after the general one.
      { source: "/api/blob/:name", headers: [{ key: "Content-Security-Policy", value: "default-src 'none'; sandbox" }] },
    ];
  },
};

// BotID adds rewrites so its challenge script loads from this site's own
// domain (no third-party script for the CSP to allow, nothing for ad
// blockers to strip).
export default withBotId(nextConfig);
