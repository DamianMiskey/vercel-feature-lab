// The same jobs, done on each platform. Vercel slugs are pages in this lab;
// Cloudflare slugs are pages in the Cloudflare Feature Lab (lab.djmiskey.com).
export const CLOUDFLARE_LAB = "https://lab.djmiskey.com";

// Page names in the Cloudflare lab (from its src/features.ts).
export const cloudflarePages: Record<string, string> = {
  basics: "Workers basics", assets: "Static Assets", pages: "Workers vs Pages", kv: "Workers KV", r2: "R2",
  images: "Images", d1: "D1", hyperdrive: "Hyperdrive", "durable-objects": "Durable Objects",
  "rate-limiting": "Rate Limiting", cron: "Cron Triggers", queues: "Queues", workflows: "Workflows", ai: "Workers AI",
  "ai-gateway": "AI Gateway", agents: "Agents SDK", vectorize: "Vectorize", security: "Security",
  observability: "Logs & Observability", "analytics-engine": "Analytics Engine", email: "Email Workers", browser: "Browser Run",
};

export type Row = { job: string; vercel: string[]; cloudflare: string[]; note: string };

export const rows: Row[] = [
  { job: "Read the request", vercel: ["basics"], cloudflare: ["basics"],
    note: "Vercel adds x-vercel-ip-* headers; Workers get a request.cf object. Same idea: geo and network data for free." },
  { job: "Serve pages", vercel: ["ssr", "static", "streaming"], cloudflare: ["assets", "pages"],
    note: "Next.js decides per component what's static, cached or per request; the Cloudflare lab is a React SPA served as static assets plus a Worker API." },
  { job: "Run code before the page", vercel: ["proxy"], cloudflare: ["basics"],
    note: "Next.js Proxy sits in front of routes; on Cloudflare the Worker is the front door, so every request already runs your code first." },
  { job: "Fast config and flags", vercel: ["edge-config"], cloudflare: ["kv"],
    note: "Global Config is built for config read on every request; Workers KV is a general, eventually consistent key-value store." },
  { job: "Files", vercel: ["blob"], cloudflare: ["r2", "images"],
    note: "Both store objects. R2 has no egress fees and an S3 API; Cloudflare Images adds resizing on the fly." },
  { job: "SQL", vercel: ["postgres"], cloudflare: ["d1", "hyperdrive"],
    note: "Vercel installs Postgres from the Marketplace (Neon). Cloudflare has its own SQLite (D1), and Hyperdrive to reach outside Postgres." },
  { job: "Counters and state", vercel: ["redis"], cloudflare: ["kv", "durable-objects"],
    note: "Upstash Redis via the Marketplace. Durable Objects give strongly consistent state with code attached, including WebSockets." },
  { job: "Rate limiting", vercel: ["redis", "security"], cloudflare: ["rate-limiting"],
    note: "This lab rate-limits with Upstash (the Vercel WAF's limiter is billed); Workers have a built-in rate-limiting binding." },
  { job: "Scheduled jobs", vercel: ["cron"], cloudflare: ["cron"],
    note: "Both call your code on a cron schedule. Vercel Hobby: at most once a day." },
  { job: "Work after the response", vercel: ["after"], cloudflare: ["queues", "workflows"],
    note: "after() keeps the function alive briefly. Cloudflare adds durable queues and multi-step workflows with retries." },
  { job: "AI", vercel: ["ai"], cloudflare: ["ai", "ai-gateway", "agents", "vectorize"],
    note: "AI SDK + AI Gateway route to other providers (simulated here, to avoid any bill). Cloudflare runs models on its own GPUs." },
  { job: "Security", vercel: ["security"], cloudflare: ["security"],
    note: "Here: CSP with nonces, Firewall rules in vercel.json, BotID. Both platforms put a firewall in front for free." },
  { job: "Observability", vercel: ["observability"], cloudflare: ["observability", "analytics-engine"],
    note: "Vercel: Web Analytics, Speed Insights, runtime logs. Cloudflare: Workers Logs, tail, and custom metrics with SQL." },
];

// Things one lab has that the other doesn't (yet).
export const onlyOnCloudflare = ["email", "browser"];
