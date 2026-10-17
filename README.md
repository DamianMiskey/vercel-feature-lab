# Vercel Feature Lab

A hands-on tour of Vercel and Next.js. Each page demos one feature live, explains it, and shows the code behind it. It's the companion to the [Cloudflare Feature Lab](https://lab.djmiskey.com) ([repo](https://github.com/DamianMiskey/cf-feature-lab)), built to the same pattern so the two platforms can be compared side by side.

**Stack:** Next.js 16 (App Router, TypeScript, **Cache Components**) · deployed on Vercel at `vercel.djmiskey.com` (planned).

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
npm test          # Vitest: request helpers, feature registry, route handlers, revalidation webhook, Proxy rules and session cookies, flag bucketing
npm run build     # also catches Cache Components mistakes
```

CI (`.github/workflows/ci.yml`) runs all four on every pull request.

## Layout

| Path | What lives there |
|------|------------------|
| `src/lib/features.ts` | Registry of all features; drives the nav and the home page |
| `src/app/<slug>/page.tsx` | One folder per built feature page |
| `src/app/[slug]/page.tsx` | Placeholder pages for features from later phases |
| `src/app/api/*/route.ts` | Route handlers (API endpoints, run as Vercel Functions) |
| `src/components/` | `FeaturePage`, `Demo`, `JsonView`, `CodePeek`, `Nav` |
| `src/proxy.ts` | Proxy (formerly middleware); its rules live in `src/lib/proxy-rules.ts` |
| `src/flags.ts` | Feature flags (Flags SDK), decided from Global Config |
| `next.config.ts` | Cache Components + security headers |

**Adding a feature:** create `src/app/<slug>/page.tsx` using `FeaturePage`, then set `ready: true` in `features.ts`. A test checks that every ready feature has a page.

## Notes

- **Cache Components** is on: pages are a static shell plus streamed dynamic parts (Partial Prerendering). Request-time APIs like `headers()` must sit inside `<Suspense>`, and values like `new Date()` must be either cached (`"use cache"`) or read after `await connection()`. The build fails otherwise. The `/basics` page shows both.
- **`CodePeek`** reads source files with a `"use cache"` function scoped to `src/`, so the code is baked in at build time and only `src/` is traced into the deployment. It uses `cacheLife("max")`: a page's cache life is the shortest of everything on it, so a shorter one here would make every page revalidate early. `next build` prints each page's life in its "Revalidate" column.
- **On-demand revalidation** (`/static`): the button is a Server Action calling `updateTag()`; CMS-style webhooks call `POST /api/static/revalidate` with `Authorization: Bearer $REVALIDATE_SECRET`, which runs `revalidateTag(tag, "max")`. Set `REVALIDATE_SECRET` (Sensitive) in Vercel; without it the webhook answers 503.
- **Security headers** (HSTS, nosniff, frame denial, referrer and permissions policies, a baseline CSP) are set in `next.config.ts`. A nonce-based CSP arrives in phase 6.
- **Proxy** (`/proxy`) only runs on `/proxy/*` (see its `matcher`). It rewrites `/proxy/ab` and `/proxy/geo` to prerendered pages, so the personalised routes stay static, and gates `/proxy/members` with an HMAC-signed session cookie. Set `SESSION_SECRET` (Sensitive) in Vercel; without it sign-in is switched off. The members page re-checks the session itself rather than trusting Proxy alone.
- **Global Config** (formerly Edge Config, `/edge-config`) reads the `feature-lab` store through the `GLOBAL_CONFIG` connection string (Sensitive). `vercel storage connect` currently fails for Global Config ("Generating edge-config environment variables is not supported"), so the variable was set by hand from a read token: `vercel global-config tokens feature-lab --add <label>`. Edit items with `vercel global-config update feature-lab --patch '[{"operation":"upsert","key":"…","value":…}]'`; changes show up within seconds, no redeploy.
- **Feature flags** use the Flags SDK, which needs `FLAGS_SECRET` (32 random bytes, base64url, a different value per environment). The `new-hero` flag hashes the `lab-visitor` cookie (set by Proxy on `/edge-config`) into a bucket 0–99 and is on below `rollout.new-hero` in Global Config.
- **`npm audit`**: production dependencies are clean. Five findings sit in the ESLint toolchain (`eslint-config-next` → `fast-glob` → `micromatch` → `braces`, a ReDoS). No patched `braces` exists yet, and the linter never ships to Vercel.

## Roadmap

- [x] **Phase 1: Scaffold.** Dashboard, feature registry, Request basics (request inspector, Vercel geo headers, env vars vs secrets, route handler), security headers, Vitest, CI
- [x] **Phase 2: Rendering.** Server rendering (Server and Client Components, searchParams), static and ISR (time-based, on demand with `updateTag`/`revalidateTag`, `generateStaticParams`), streaming and Partial Prerendering (parallel and nested Suspense, promises into `use()`, streaming route handlers)
- [x] **Phase 3: Edge.** Proxy (formerly middleware: headers, A/B test, geo routing, auth gate), Global Config (formerly Edge Config), feature flags with the Flags SDK and a gradual rollout
- [ ] **Phase 4: Storage.** Vercel Blob, Neon Postgres and Upstash Redis through the Marketplace
- [ ] **Phase 5: Async & AI.** Cron Jobs, `after()`, AI SDK with AI Gateway
- [ ] **Phase 6: Security.** CSP with nonces, Firewall and bot protection, rate limiting, BotID
- [ ] **Phase 7: Platform.** Preview deployments, Analytics, Speed Insights, Observability, Vercel vs Cloudflare comparison
