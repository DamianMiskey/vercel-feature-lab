# Vercel Feature Lab

A hands-on tour of Vercel and Next.js. Each page demos one feature live, explains it, and shows the code behind it. It's the companion to the [Cloudflare Feature Lab](https://lab.djmiskey.com) ([repo](https://github.com/DamianMiskey/cf-feature-lab)), built to the same pattern so the two platforms can be compared side by side.

**Stack:** Next.js 16 (App Router, TypeScript, **Cache Components**) · live at **https://vercel.djmiskey.com** (also `vercel-feature-lab.vercel.app`).

## Run it

```bash
npm install
cp .env.example .env.local   # local env vars and a dummy secret
npm run dev                  # http://localhost:3000
```

Production build locally: `npm run build && npm start`.

## Checks

```bash
npm run lint
npm run typecheck
npm test          # Vitest: request helpers, feature registry, route handlers, revalidation webhook, Proxy rules and session cookies, flag bucketing, upload checks, note rules, rate-limit helpers, cron route and config, simulated AI chat, CSP, firewall rules and reports, the comparison table
npm run build     # also catches Cache Components mistakes
npm run db:migrate  # applies db/schema.sql to DATABASE_URL (safe to re-run)
```

CI (`.github/workflows/ci.yml`) runs all four on every pull request.

## Layout

| Path | What lives there |
|------|------------------|
| `src/lib/features.ts` | Registry of all features; drives the nav and the home page |
| `src/app/<slug>/page.tsx` | One folder per built feature page |
| `src/app/api/*/route.ts` | Route handlers (API endpoints, run as Vercel Functions) |
| `src/components/` | `FeaturePage`, `Demo`, `JsonView`, `CodePeek`, `Nav` |
| `src/proxy.ts` | Proxy (formerly middleware); its rules live in `src/lib/proxy-rules.ts` |
| `src/flags.ts` | Feature flags (Flags SDK), decided from Global Config |
| `vercel.json` | Cron schedule and Firewall rules |
| `src/lib/comparison.ts` | Vercel vs Cloudflare mapping (tests keep it in sync with both labs' pages) |
| `src/instrumentation-client.ts` | BotID client (which routes get the invisible challenge) |
| `db/schema.sql` | Postgres schema (the guestbook table) |
| `next.config.ts` | Cache Components + security headers (plus a sandboxing CSP for uploaded files) |

**Adding a feature:** create `src/app/<slug>/page.tsx` using `FeaturePage` and add it to `features.ts` with `ready: true`. A test checks that every ready feature has a page. (The `[slug]` placeholder route for unbuilt features was removed once every feature was built; bring it back if you add `ready: false` entries.)

## Notes

- **Cache Components** is on: pages are a static shell plus streamed dynamic parts (Partial Prerendering). Request-time APIs like `headers()` must sit inside `<Suspense>`, and values like `new Date()` must be either cached (`"use cache"`) or read after `await connection()`. The build fails otherwise. The `/basics` page shows both.
- **`CodePeek`** reads source files with a `"use cache"` function scoped to `src/`, so the code is baked in at build time and only `src/` is traced into the deployment. It uses `cacheLife("max")`: a page's cache life is the shortest of everything on it, so a shorter one here would make every page revalidate early. `next build` prints each page's life in its "Revalidate" column.
- **On-demand revalidation** (`/static`): the button is a Server Action calling `updateTag()`; CMS-style webhooks call `POST /api/static/revalidate` with `Authorization: Bearer $REVALIDATE_SECRET`, which runs `revalidateTag(tag, "max")`. Set `REVALIDATE_SECRET` (Sensitive) in Vercel; without it the webhook answers 503.
- **Security headers** (HSTS, nosniff, frame denial, referrer and permissions policies, CSP) are set in `next.config.ts`.
- **Proxy** (`/proxy`) only runs on `/proxy/*` (see its `matcher`). It rewrites `/proxy/ab` and `/proxy/geo` to prerendered pages, so the personalised routes stay static, and gates `/proxy/members` with an HMAC-signed session cookie. Set `SESSION_SECRET` (Sensitive) in Vercel; without it sign-in is switched off. The members page re-checks the session itself rather than trusting Proxy alone.
- **Global Config** (formerly Edge Config, `/edge-config`) reads the `feature-lab` store through the `GLOBAL_CONFIG` connection string (Sensitive). `vercel storage connect` currently fails for Global Config ("Generating edge-config environment variables is not supported"), so the variable was set by hand from a read token: `vercel global-config tokens feature-lab --add <label>`. Edit items with `vercel global-config update feature-lab --patch '[{"operation":"upsert","key":"…","value":…}]'`; changes show up within seconds, no redeploy.
- **Feature flags** use the Flags SDK, which needs `FLAGS_SECRET` (32 random bytes, base64url, a different value per environment). The `new-hero` flag hashes the `lab-visitor` cookie (set by Proxy on `/edge-config`) into a bucket 0–99 and is on below `rollout.new-hero` in Global Config.
- **Vercel Blob** (`/blob`) uses the private store `lab-uploads`, connected with OIDC: on Vercel the SDK signs in with the deployment's short-lived token (`BLOB_STORE_ID` + `VERCEL_OIDC_TOKEN`), so there's no long-lived Blob key. Locally, copy those two from `vercel env pull` into `.env.local` (the token lasts ~12 hours). Uploads need the lab session (sign in on `/proxy`; the session cookie is now site-wide), must be PNG/JPEG/GIF/WebP by their bytes (no SVG), stay under 900 KB (Server Actions cap bodies at 1 MB), get random names, and only the newest 12 are kept. Files are served by `/api/blob/[name]`, which checks the session; `next.config.ts` gives those responses `default-src 'none'; sandbox` (config headers override a route's own). Heads-up: `vercel blob del` with several pathnames joins them into one key and deletes nothing, despite reporting success; delete one at a time.
- **Neon Postgres** (`/postgres`) and **Upstash Redis** (`/redis`) come from the Vercel Marketplace (installed with `vercel integration add … --no-env-pull`, so `.env.local` isn't overwritten). Both are in `iad1`. All three environments share **one** Neon database, so preview deployments write to the production data. The guestbook needs the lab session; notes are one line, 1–280 characters (also enforced by `CHECK` constraints), and only the newest 50 are kept. Every write in the lab (uploads and notes) shares a Redis rate limit of 5 per minute per IP (`@upstash/ratelimit`, sliding window), which fails open if Redis isn't configured. The installs also dropped provider "agent skills" into `.agents/` and `skills-lock.json`; they're left untracked.
- **Cron Jobs** (`/cron`): `vercel.json` makes Vercel call `GET /api/cron/cleanup` daily at 03:00 UTC (Hobby: at most daily, fired within the hour, production only). The route requires `Authorization: Bearer $CRON_SECRET` (Sensitive, production), deletes notes and uploads older than 7 days, and records each run in Redis. Trigger it by hand with `vercel crons run /api/cron/cleanup`.
- **`after()`** (`/after`): a Server Action returns immediately and hands 2 seconds of work to `after()`, which logs to Redis when done; the page shows how long after the response each job finished.
- **AI SDK** (`/ai`) is **simulated** on purpose: AI Gateway needs a credit card on file even for its free tier and $0.00 models, and this lab avoids any chance of a bill. The route uses the real AI SDK v7 pipeline (`validateUIMessages` → `convertToModelMessages` → `streamText` → `toUIMessageStream` → `createUIMessageStreamResponse`, with `useChat` in the browser), but the model is the SDK's `MockLanguageModelV4`, which streams a canned reply. Setting `AI_MODEL` (e.g. `anthropic/claude-haiku-4.5`) switches to a real model through AI Gateway with no other change. The route is rate-limited (shared 5 per 30 s demo budget), caps input at 500 characters and output at 300 tokens. `useChat` gets a fixed `id`, because its random default trips Cache Components at prerender.
- **CSP** comes in two strengths. Site-wide (`next.config.ts`): everything locked to this site, but `script-src` must allow `'unsafe-inline'`, because prerendered pages carry Next.js's inline scripts and a nonce can't be baked in at build time (hash-based SRI only covers script files, and is experimental). `/security` shows the strict version: Proxy sets a per-request nonce with `'strict-dynamic'`, and the page has **no static shell** (`export const instant = false` plus `await connection()` outside Suspense), because a prerendered shell's scripts have no nonce and would be blocked. Violations go to `/api/security/csp-report` via `report-uri` (immediate; `report-to` batches for up to a minute) and the last ten are kept in Redis. Verified in headless Edge: the nonce'd script runs, the injected one is blocked and reported, and no other page logs a CSP error.
- **Firewall** rules live in `vercel.json` `routes` with `mitigate`: deny common scanner paths (`/wp-admin`, `/.env`, `/.git`…) and challenge `/security/challenge`. Custom rules (up to 3 on Hobby), IP blocks and Attack Mode are free, and mitigated traffic isn't billed. WAF rate limiting is billed, so the lab rate-limits with Upstash instead.
- **BotID** runs at the Basic level only (free on all plans; Deep Analysis is Pro-only and paid). It protects `/api/security/botid` and the guestbook. Off Vercel it can't run, so `verifyHuman()` treats every non-Vercel environment as development.
- **Web Analytics and Speed Insights** are `<Analytics />` and `<SpeedInsights />` in the root layout, inside `<Suspense>` (they read search params). Both are free on Hobby and pause at their limits instead of billing: 50,000 analytics events a month, 10,000 Speed Insights events per rolling 30 days. They must also be switched on in the project's Analytics and Speed Insights tabs. Their scripts load from `/_vercel/…` on this domain, so the CSP needs no exceptions.
- **`/observability`** shows the deployment's system variables (production vs preview, branch, commit, URLs) and writes a JSON log line you can find with `vercel logs`. **`/vs-cloudflare`** maps every page here to its counterpart in the Cloudflare lab.
- **Custom domain**: `vercel.djmiskey.com` is a `CNAME` to the project's Vercel DNS target, added in Cloudflare (where `djmiskey.com` lives) with the proxy **off** (DNS only), so Vercel issues the certificate and its Firewall, BotID and geo headers see real visitors. The nameservers stay on Cloudflare, so `lab.djmiskey.com` and email are untouched.
- **`npm audit`**: production dependencies are clean. Five findings sit in the ESLint toolchain (`eslint-config-next` → `fast-glob` → `micromatch` → `braces`, a ReDoS). No patched `braces` exists yet, and the linter never ships to Vercel.

## Roadmap

- [x] **Phase 1: Scaffold.** Dashboard, feature registry, Request basics (request inspector, Vercel geo headers, env vars vs secrets, route handler), security headers, Vitest, CI
- [x] **Phase 2: Rendering.** Server rendering (Server and Client Components, searchParams), static and ISR (time-based, on demand with `updateTag`/`revalidateTag`, `generateStaticParams`), streaming and Partial Prerendering (parallel and nested Suspense, promises into `use()`, streaming route handlers)
- [x] **Phase 3: Edge.** Proxy (formerly middleware: headers, A/B test, geo routing, auth gate), Global Config (formerly Edge Config), feature flags with the Flags SDK and a gradual rollout
- [x] **Phase 4: Storage.** Vercel Blob (private, OIDC), Neon Postgres (guestbook) and Upstash Redis (atomic counter, rate limits) through the Marketplace
- [x] **Phase 5: Async & AI.** Cron Jobs, `after()`, AI SDK chat (simulated model; AI Gateway one env var away)
- [x] **Phase 6: Security.** Site-wide CSP plus a strict nonce CSP with violation reports, Firewall rules in `vercel.json`, BotID (Basic), rate limiting with Upstash
- [x] **Phase 7: Platform.** Web Analytics, Speed Insights, runtime logs and deployment info, Vercel vs Cloudflare comparison
