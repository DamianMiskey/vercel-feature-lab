import type { NextConfig } from "next";

// Security headers for every response. A full Content Security Policy with
// nonces (script-src etc.) arrives in the security phase; this baseline
// already blocks framing, plugins and base-tag injection without touching scripts.
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Content-Security-Policy", value: "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'" },
];

const nextConfig: NextConfig = {
  // Cache Components: Partial Prerendering by default, plus "use cache".
  cacheComponents: true,
  // Don't advertise the framework in an X-Powered-By header.
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Uploaded files (Blob demo): even if one weren't the image it claims to
      // be, opening it directly couldn't run scripts or load anything. Config
      // headers override a route's own, and the later rule wins, so this
      // stricter policy has to live here, after the general one.
      { source: "/api/blob/:name", headers: [{ key: "Content-Security-Policy", value: "default-src 'none'; sandbox" }] },
    ];
  },
};

export default nextConfig;
