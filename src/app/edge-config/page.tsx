import { cookies } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";
import { CodePeek } from "@/components/CodePeek";
import { Demo, FeaturePage, JsonView } from "@/components/FeaturePage";
import { newHeroFlag } from "@/flags";
import { getFeature } from "@/lib/features";
import { type ConfigRead, bucketOf, readLabConfig, rolloutPercent } from "@/lib/global-config";
import { VISITOR_COOKIE } from "@/lib/proxy-rules";

type Read = { read: Promise<ConfigRead> };

const Unavailable = ({ reason }: { reason: string }) => <p className="error">{reason}</p>;

async function StoreContents({ read }: Read) {
  const result = await read;
  if (!result.ok) return <Unavailable reason={result.reason} />;
  return (
    <>
      <p>Read every item in <strong className="stamp">{result.ms.toFixed(1)} ms</strong>, on this request:</p>
      <JsonView value={result.config} />
    </>
  );
}

async function Banner({ read }: Read) {
  const result = await read;
  if (!result.ok) return <Unavailable reason={result.reason} />;
  const banner = result.config.banner;
  if (!banner?.enabled || !banner.message) {
    return <p className="muted">The banner is <strong>off</strong> (<code>banner.enabled</code> is false), so nothing is shown.</p>;
  }
  return <p role="status" className={banner.tone === "warning" ? "error" : undefined}><strong>📣 {banner.message}</strong></p>;
}

async function Featured({ read }: Read) {
  const result = await read;
  if (!result.ok) return <Unavailable reason={result.reason} />;
  const feature = result.config.featured ? getFeature(result.config.featured) : undefined;
  if (!feature) return <p className="muted">No featured page set (or <code>featured</code> names a page that doesn&apos;t exist).</p>;
  return <p>Featured today: <Link href={`/${feature.slug}`}><strong>{feature.name}</strong></Link>. {feature.summary}</p>;
}

async function Rollout({ read }: Read) {
  const [result, showNewHero, visitorId] = await Promise.all([
    read,
    newHeroFlag(),
    cookies().then((c) => c.get(VISITOR_COOKIE)?.value),
  ]);
  const percent = result.ok ? rolloutPercent(result.config, "new-hero") : 0;
  const bucket = visitorId ? bucketOf(visitorId, "new-hero") : null;
  return (
    <>
      <div className="cells">
        <div className="cell"><span className="small muted">Rollout</span><strong>{percent}% of visitors</strong></div>
        <div className="cell"><span className="small muted">Your bucket</span><strong>{bucket ?? "none"}</strong></div>
        <div className="cell"><span className="small muted">new-hero</span><strong>{showNewHero ? "on" : "off"}</strong></div>
      </div>
      {showNewHero ? (
        <div className="cell" style={{ borderColor: "var(--accent)" }}>
          <strong>✨ The new hero</strong>
          <span className="small">Your bucket ({bucket}) is under {percent}, so you&apos;re in the rollout.</span>
        </div>
      ) : (
        <div className="cell">
          <strong>The current hero</strong>
          <span className="small muted">You&apos;ll get the new one once the rollout passes your bucket{bucket != null ? ` (${bucket})` : ""}.</span>
        </div>
      )}
    </>
  );
}

const patch = (items: object) => `vercel global-config update feature-lab --patch '${JSON.stringify(items)}'`;

export default function EdgeConfigPage() {
  // One read for the whole page, shared by every section that needs it.
  const read = readLabConfig();
  return (
    <FeaturePage
      title="Edge Config & Flags"
      tagline="Settings and feature flags your app reads in milliseconds, changed without a redeploy."
      docs="https://vercel.com/docs/global-config"
      whatItIs={<p>
        <strong>Global Config</strong> (until recently <strong>Edge Config</strong>) is a small key-value store that Vercel copies to
        every region, so reads are fast enough for every request. It&apos;s built for data that&apos;s read constantly but changed
        rarely: switches, settings, allow-lists, redirects. Writing happens outside the app (dashboard, CLI or API), and a change
        reaches every region within seconds, with no redeploy. The <strong>Flags SDK</strong> (<code>flags</code>) adds a typed
        feature-flag layer on top, whatever the flag values come from.
      </p>}
      whenToUse={[
        "Kill switches and maintenance banners",
        "Gradual rollouts and experiments",
        "Config that must change faster than a deploy: allow-lists, redirects, prices",
      ]}
    >
      <Demo title="1. The store">
        <p>The page reads the <code>feature-lab</code> store with <code>getAll()</code> from <code>@vercel/global-config</code>. The SDK finds it through the <code>GLOBAL_CONFIG</code> connection string.</p>
        <Suspense fallback={<p className="muted">Reading Global Config…</p>}>
          <StoreContents read={read} />
        </Suspense>
      </Demo>

      <Demo title="2. A switch: the banner">
        <Suspense fallback={<p className="muted">Reading…</p>}>
          <Banner read={read} />
        </Suspense>
        <p className="small muted">
          Turn it on, then reload within a few seconds:{" "}
          <code>{patch([{ operation: "upsert", key: "banner", value: { enabled: true, message: "Maintenance tonight at 22:00", tone: "warning" } }])}</code>
        </p>
      </Demo>

      <Demo title="3. A setting: the featured page">
        <Suspense fallback={<p className="muted">Reading…</p>}>
          <Featured read={read} />
        </Suspense>
        <p className="small muted">Change it: <code>{patch([{ operation: "upsert", key: "featured", value: "proxy" }])}</code></p>
      </Demo>

      <Demo title="4. A feature flag with a gradual rollout">
        <p>
          The <code>new-hero</code> flag is declared with the Flags SDK in <code>src/flags.ts</code>. Proxy gives every visitor a
          random id in a cookie, the flag hashes it to a bucket from 0 to 99, and the flag is on when the bucket is below the
          percentage in Global Config.
        </p>
        <Suspense fallback={<p className="muted">Evaluating the flag…</p>}>
          <Rollout read={read} />
        </Suspense>
        <p className="small muted">Roll out to everyone: <code>{patch([{ operation: "upsert", key: "rollout", value: { "new-hero": 100 } }])}</code></p>
      </Demo>

      <CodePeek file="app/edge-config/page.tsx" />
      <CodePeek file="lib/global-config.ts" />
      <CodePeek file="flags.ts" />
    </FeaturePage>
  );
}
