// Single source of truth for the dashboard: every Vercel / Next.js feature in
// the lab, grouped by category. `ready: false` marks features from later phases.
export type Category = "Basics" | "Rendering" | "Edge" | "Storage" | "Async & AI" | "Security" | "Platform";

export type Feature = {
  slug: string;
  name: string;
  category: Category;
  summary: string;
  phase: number;
  ready: boolean;
};

export const features: Feature[] = [
  { slug: "basics", name: "Request basics", category: "Basics", phase: 1, ready: true,
    summary: "Request inspector, Vercel geo headers, env vars vs secrets." },

  { slug: "ssr", name: "Server rendering", category: "Rendering", phase: 2, ready: true,
    summary: "Render per request with Server Components." },
  { slug: "static", name: "Static & ISR", category: "Rendering", phase: 2, ready: true,
    summary: "Prerendered pages, revalidation on a timer or on demand." },
  { slug: "streaming", name: "Streaming & PPR", category: "Rendering", phase: 2, ready: true,
    summary: "A static shell first, dynamic parts streamed in (Cache Components)." },

  { slug: "proxy", name: "Proxy (middleware)", category: "Edge", phase: 3, ready: true,
    summary: "Geo routing, A/B tests and auth gates before the page runs." },
  { slug: "edge-config", name: "Edge Config & Flags", category: "Edge", phase: 3, ready: true,
    summary: "Ultra-fast reads of config and feature flags." },

  { slug: "blob", name: "Vercel Blob", category: "Storage", phase: 4, ready: true,
    summary: "File and object storage." },
  { slug: "postgres", name: "Postgres (Neon)", category: "Storage", phase: 4, ready: true,
    summary: "Serverless Postgres through the Vercel Marketplace." },
  { slug: "redis", name: "Redis (Upstash)", category: "Storage", phase: 4, ready: true,
    summary: "Key-value data and counters through the Marketplace." },

  { slug: "cron", name: "Cron Jobs", category: "Async & AI", phase: 5, ready: true,
    summary: "Run a route on a schedule." },
  { slug: "after", name: "after()", category: "Async & AI", phase: 5, ready: true,
    summary: "Work that runs after the response is sent." },
  { slug: "ai", name: "AI SDK + AI Gateway", category: "Async & AI", phase: 5, ready: true,
    summary: "Streaming AI responses through Vercel's AI Gateway." },

  { slug: "security", name: "Security", category: "Security", phase: 6, ready: true,
    summary: "CSP with nonces, Firewall, bot protection, rate limits, BotID." },

  { slug: "observability", name: "Analytics & Observability", category: "Platform", phase: 7, ready: false,
    summary: "Web Analytics, Speed Insights, logs and preview deployments." },
  { slug: "vs-cloudflare", name: "Vercel vs Cloudflare", category: "Platform", phase: 7, ready: false,
    summary: "The same features side by side with the Cloudflare lab." },
];

export const categories = [...new Set(features.map((f) => f.category))];
export const getFeature = (slug: string) => features.find((f) => f.slug === slug);
