import { cacheLife } from "next/cache";
import { connection } from "next/server";
import { Suspense } from "react";
import { CodePeek } from "@/components/CodePeek";
import { Demo, FeaturePage } from "@/components/FeaturePage";
import { delay } from "@/lib/delay";
import { Fortune } from "./Fortune";
import { StreamReader } from "./StreamReader";

// Part of the static shell: computed at build time.
async function shellBuiltAt() {
  "use cache";
  cacheLife("max");
  return new Date().toISOString();
}

// A dynamic hole: waits for the request, then for a slow "data source".
async function Slow({ label, ms }: { label: string; ms: number }) {
  await connection();
  await delay(ms);
  return (
    <div className="cell">
      <strong>{label}</strong>
      <span className="small muted">arrived after {ms} ms at <span className="stamp">{new Date().toISOString().slice(11, 23)}</span></span>
    </div>
  );
}

const Pending = ({ label }: { label: string }) => (
  <div className="cell"><strong>{label}</strong><span className="small muted">streaming…</span></div>
);

// Not awaited here: the promise is handed to a Client Component, which reads
// it with use(). The server streams the value in when it resolves.
async function getFortune() {
  await connection();
  await delay(2000);
  const fortunes = ["Your build will pass on the first try.", "A cache hit is in your future.", "Today you will ship."];
  return fortunes[Math.floor(Math.random() * fortunes.length)];
}

export default async function StreamingPage() {
  const builtAt = await shellBuiltAt();
  const fortune = getFortune();
  return (
    <FeaturePage
      title="Streaming & PPR"
      tagline="Send a static shell at once, then stream each dynamic part as it's ready."
      docs="https://nextjs.org/docs/app/guides/streaming"
      whatItIs={<p>
        <strong>Partial Prerendering</strong> (PPR), the default with Cache Components, splits a page in two. Everything that
        doesn&apos;t depend on the request is prerendered into a <strong>static shell</strong> that Vercel serves from its cache straight
        away. Each <code>&lt;Suspense&gt;</code> boundary around request-time work is a <strong>dynamic hole</strong>: its fallback is
        part of the shell, and the real content is <strong>streamed</strong> into the same HTTP response as soon as it&apos;s ready.
      </p>}
      whenToUse={[
        "Pages that mix static content with personalised or slow data",
        "Slow backends: show the page at once instead of waiting for the slowest query",
        "Long responses from route handlers, like logs or AI output",
      ]}
    >
      <Demo title="1. Static shell">
        <p>
          The page heading, this text and all the fallbacks below were rendered at build time
          (<strong className="stamp">{builtAt}</strong>). Reload the page: they appear instantly, before any of the slow parts.
        </p>
      </Demo>

      <Demo title="2. Parallel boundaries">
        <p>Three sibling <code>&lt;Suspense&gt;</code> boundaries. Each streams in as soon as its own data is ready, without waiting for the others.</p>
        <div className="cells">
          <Suspense fallback={<Pending label="Fast" />}><Slow label="Fast" ms={500} /></Suspense>
          <Suspense fallback={<Pending label="Medium" />}><Slow label="Medium" ms={1500} /></Suspense>
          <Suspense fallback={<Pending label="Slow" />}><Slow label="Slow" ms={3000} /></Suspense>
        </div>
      </Demo>

      <Demo title="3. Nested boundaries">
        <p>The inner boundary only starts showing once the outer one has resolved: a progressive reveal, like a product page with reviews.</p>
        <div className="cells">
          <Suspense fallback={<Pending label="Product" />}>
            <Slow label="Product" ms={1000} />
            <Suspense fallback={<Pending label="Reviews" />}><Slow label="Reviews" ms={2500} /></Suspense>
          </Suspense>
        </div>
      </Demo>

      <Demo title="4. Streaming a promise to a Client Component">
        <p>The server starts the work and passes the unresolved promise as a prop. The Client Component unwraps it with React&apos;s <code>use()</code>.</p>
        <Suspense fallback={<p className="muted">Consulting the oracle…</p>}>
          <Fortune fortune={fortune} />
        </Suspense>
      </Demo>

      <Demo title="5. Streaming from a route handler">
        <p><code>/api/streaming</code> returns a <code>ReadableStream</code>. The browser reads it chunk by chunk with <code>response.body.getReader()</code>.</p>
        <StreamReader />
      </Demo>

      <p className="small muted">
        See the stream from a terminal: <code>curl -N https://&lt;host&gt;/streaming</code> prints the shell first, then each part as it arrives.
      </p>

      <CodePeek file="app/streaming/page.tsx" />
      <CodePeek file="app/streaming/Fortune.tsx" />
      <CodePeek file="app/api/streaming/route.ts" />
    </FeaturePage>
  );
}
