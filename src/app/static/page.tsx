import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { CodePeek } from "@/components/CodePeek";
import { Demo, FeaturePage } from "@/components/FeaturePage";
import { ON_DEMAND_TAG } from "@/lib/revalidate";
import { refreshNow } from "./actions";

// Each function below is cached with "use cache". A page's cache life is the
// shortest of everything on it, so the timed demo lives on /static/[id]: here
// both entries last until the next deploy or until their tag is invalidated.

async function builtAt() {
  "use cache";
  cacheLife("max");
  return new Date().toISOString();
}

// Cached until someone invalidates the tag (Server Action or webhook below).
async function onDemand() {
  "use cache";
  cacheLife("max");
  cacheTag(ON_DEMAND_TAG);
  return { generatedAt: new Date().toISOString(), lucky: Math.floor(Math.random() * 100) };
}

function Snapshot({ generatedAt, lucky }: { generatedAt: string; lucky: number }) {
  return (
    <div className="cells">
      <div className="cell"><span className="small muted">Generated at</span><strong className="stamp">{generatedAt}</strong></div>
      <div className="cell"><span className="small muted">Lucky number</span><strong className="stamp">{lucky}</strong></div>
    </div>
  );
}

export default async function StaticPage() {
  const [built, tagged] = await Promise.all([builtAt(), onDemand()]);
  return (
    <FeaturePage
      title="Static & ISR"
      tagline="Prerender once, serve from Vercel's cache, regenerate on a timer or on demand."
      docs="https://nextjs.org/docs/app/getting-started/revalidating"
      whatItIs={<p>
        This whole page is <strong>static</strong>: it touches no request data, so it&apos;s rendered at build time and served from
        Vercel&apos;s cache. With Cache Components you opt data into the cache with <code>&quot;use cache&quot;</code> and choose how long
        it lives with <code>cacheLife()</code>. <strong>Incremental Static Regeneration</strong> (ISR) refreshes cached content
        without a redeploy: on a timer, or on demand by invalidating a <code>cacheTag()</code> with <code>updateTag()</code> or{" "}
        <code>revalidateTag()</code>.
      </p>}
      whenToUse={[
        "Marketing pages, docs and blogs: static, with an occasional refresh",
        "CMS content: cache forever, revalidate from the CMS webhook on publish",
        "Product pages: prerender the popular ones, generate the rest on first visit",
      ]}
    >
      <Demo title="1. Static: built once">
        <p>Cached with <code>cacheLife(&quot;max&quot;)</code>. This timestamp stays until the next deploy (or until the cache entry is evicted).</p>
        <p>Built at <strong className="stamp">{built}</strong></p>
      </Demo>

      <Demo title="2. On-demand ISR: refresh when the data changes">
        <p>
          Cached forever with tag <code>{ON_DEMAND_TAG}</code>. The button calls a <strong>Server Action</strong> that runs{" "}
          <code>updateTag()</code>: the cache entry expires at once and you see fresh values straight away (read-your-own-writes).
        </p>
        <Snapshot {...tagged} />
        <form action={refreshNow}>
          <button type="submit">Regenerate now</button>
        </form>
        <p className="small muted">
          A CMS would call the webhook instead: <code>POST /api/static/revalidate</code> with{" "}
          <code>Authorization: Bearer $REVALIDATE_SECRET</code>. It runs <code>revalidateTag(tag, &quot;max&quot;)</code>, which marks
          the entry stale: the next visitor gets the old copy while the new one is built.
        </p>
      </Demo>

      <Demo title="3. Time-based ISR on dynamic routes">
        <p>
          <code>/static/[id]</code> uses <code>generateStaticParams()</code> to prerender items 1 to 3 at build time. Any other id up
          to 50 is generated on its first visit (watch it take a moment), then cached. Each item uses{" "}
          <code>cacheLife(&quot;minutes&quot;)</code>: after a minute the next visitor still gets the cached copy instantly while Vercel
          regenerates it in the background (stale-while-revalidate), so the visit after that shows a new timestamp.
        </p>
        <p>
          {[1, 2, 3].map((id) => <Link key={id} href={`/static/${id}`} style={{ marginRight: "0.75rem" }}>Item {id} (prerendered)</Link>)}
          <Link href="/static/42">Item 42 (on demand)</Link>
        </p>
      </Demo>

      <CodePeek file="app/static/page.tsx" />
      <CodePeek file="app/static/actions.ts" />
      <CodePeek file="app/api/static/revalidate/route.ts" />
      <CodePeek file="app/static/[id]/page.tsx" />
    </FeaturePage>
  );
}
