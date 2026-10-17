import { connection } from "next/server";
import { Suspense } from "react";
import { CodePeek } from "@/components/CodePeek";
import { Demo, FeaturePage } from "@/components/FeaturePage";
import { redis, redisConfigured } from "@/lib/redis";
import { timed } from "@/lib/timed";
import { LimitButton } from "./LimitButton";

// INCR is atomic: two requests at the same moment can't both read 41 and
// write 42. One round trip both counts this view and returns the total.
async function Views() {
  await connection();
  if (!redisConfigured()) return <p className="error">Redis isn&apos;t connected for this environment.</p>;
  const { value: views, ms } = await timed(() => redis().incr("lab:views:redis"));
  return (
    <div className="cells">
      <div className="cell"><span className="small muted">Views of this page</span><strong className="big-number" style={{ textAlign: "left" }}>{views}</strong></div>
      <div className="cell"><span className="small muted">INCR round trip</span><strong className="stamp">{ms.toFixed(1)} ms</strong></div>
    </div>
  );
}

export default function RedisPage() {
  return (
    <FeaturePage
      title="Redis (Upstash)"
      tagline="Fast key-value data: counters, rate limits, sessions, caches."
      docs="https://vercel.com/marketplace/upstash"
      whatItIs={<p>
        <strong>Upstash Redis</strong> is installed from the Vercel Marketplace, like Neon. Redis keeps data in memory, so reads and
        writes take about a millisecond, and its commands are atomic: <code>INCR</code> can&apos;t lose a count however many requests
        arrive at once. <code>@upstash/redis</code> talks to it over HTTPS, so functions need no open connections, and{" "}
        <code>@upstash/ratelimit</code> builds rate limits on top.
      </p>}
      whenToUse={[
        "Counters and leaderboards",
        "Rate limiting APIs and forms",
        "Short-lived data: sessions, caches, job state",
      ]}
    >
      <Demo title="1. An atomic counter (INCR)">
        <p>Reload the page: every view adds one.</p>
        <Suspense fallback={<p className="muted">Counting…</p>}>
          <Views />
        </Suspense>
      </Demo>

      <Demo title="2. Rate limiting">
        <p>
          A sliding window of <strong>5 requests per 30 seconds</strong> per visitor (by IP address). Click quickly: the sixth click
          is refused until the window moves on.
        </p>
        <LimitButton />
        <p className="small muted">
          The same library protects the lab&apos;s real writes: Blob uploads and guestbook notes share a budget of 5 per minute per
          visitor.
        </p>
      </Demo>

      <CodePeek file="lib/redis.ts" />
      <CodePeek file="app/redis/page.tsx" />
    </FeaturePage>
  );
}
