import { headers } from "next/headers";
import { connection } from "next/server";
import { Suspense } from "react";
import { CodePeek } from "@/components/CodePeek";
import { Demo, FeaturePage, JsonView } from "@/components/FeaturePage";
import { requestInfo } from "@/lib/request-info";
import { InspectButton } from "./InspectButton";

// Reads the live request, so it must run per request. With Cache Components
// it sits inside <Suspense>: the rest of the page is a static shell that's
// served instantly, and this part streams in.
async function RequestPanel() {
  const info = requestInfo(await headers());
  return (
    <>
      {!info.onVercel && <p className="small muted">Running locally: no Vercel headers, so geo and region show as null. Deploy to see real values.</p>}
      <p>
        Edge region <strong>{info.edgeRegion ?? "local"}</strong> → function region <strong>{info.functionRegion ?? "local"}</strong>
        {info.geo.city ? <> · you&apos;re in <strong>{info.geo.city}, {info.geo.country}</strong></> : null}
      </p>
      <JsonView value={info} />
    </>
  );
}

// Environment variables, read at request time (after connection()).
async function RuntimeEnv() {
  await connection();
  const secret = process.env.DEMO_SECRET;
  return (
    <JsonView value={{
      APP_NAME: process.env.APP_NAME ?? null,
      DEMO_SECRET: { isSet: Boolean(secret), length: secret?.length ?? 0 },
      VERCEL_ENV: process.env.VERCEL_ENV ?? "local",
      VERCEL_REGION: process.env.VERCEL_REGION ?? "local",
      VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
      readAt: new Date().toISOString(),
    }} />
  );
}

// Cache Components refuses a bare `new Date()` while prerendering: it would
// silently freeze. Asking for it explicitly with "use cache" computes it at
// build time and caches it. The default cache life revalidates every 15
// minutes, which the build output shows in its "Revalidate" column.
async function builtAt() {
  "use cache";
  return new Date().toISOString();
}

export default async function BasicsPage() {
  const shellBuiltAt = await builtAt();
  return (
    <FeaturePage
      title="Request basics"
      tagline="What a Next.js app on Vercel knows about each request, and how configuration reaches your code."
      docs="https://vercel.com/docs/headers/request-headers"
      whatItIs={<p>
        Vercel puts its network in front of your app. Every request arrives with extra headers: where the visitor is
        (<code>x-vercel-ip-*</code>), which edge region received it and where your code ran (<code>x-vercel-id</code>).
        Server Components read them with <code>headers()</code>, and route handlers get a standard <code>Request</code>.
        Configuration comes from <strong>environment variables</strong>: server-only values, <code>NEXT_PUBLIC_*</code>
        values copied into the browser bundle, sensitive secrets, and system variables Vercel sets for you.
      </p>}
      whenToUse={[
        "Personalising by country or language without a geo-IP service",
        "Debugging which region served a request",
        "Keeping secrets on the server while exposing safe settings to the browser",
      ]}
    >
      <Demo title="1. Request inspector (Server Component)">
        <p>Read on the server with <code>await headers()</code>, inside <code>&lt;Suspense&gt;</code>, because it depends on the live request.</p>
        <Suspense fallback={<p className="muted">Reading the request…</p>}>
          <RequestPanel />
        </Suspense>
      </Demo>

      <Demo title="2. Env vars vs secrets">
        <p>
          <code>APP_NAME</code> is a plain server variable. <code>DEMO_SECRET</code> is a secret: the page proves it exists without
          ever revealing it. Mark secrets <strong>Sensitive</strong> in Vercel and nobody can read them back from the dashboard.
          <code> VERCEL_*</code> are system variables Vercel sets on every deployment.
        </p>
        <Suspense fallback={<p className="muted">Reading environment…</p>}>
          <RuntimeEnv />
        </Suspense>
        <p className="small muted">
          Cached timestamp: <code>{shellBuiltAt}</code>. It comes from a <code>&quot;use cache&quot;</code> function, so it&apos;s computed at build time and refreshed in the background at most every 15 minutes (the default cache life), while <code>readAt</code> above changes on every request.
        </p>
      </Demo>

      <Demo title="3. Route handler, called from the browser">
        <p><code>app/api/basics/inspect/route.ts</code> answers with the same information as JSON: the Next.js version of an API endpoint.</p>
        <InspectButton />
      </Demo>

      <CodePeek file="app/basics/page.tsx" />
      <CodePeek file="lib/request-info.ts" />
      <CodePeek file="app/api/basics/inspect/route.ts" />
    </FeaturePage>
  );
}
