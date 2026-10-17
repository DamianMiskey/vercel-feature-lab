import { connection } from "next/server";
import { Suspense } from "react";
import { CodePeek } from "@/components/CodePeek";
import { Demo, FeaturePage, JsonView } from "@/components/FeaturePage";
import { deploymentInfo } from "@/lib/deployment";
import { LogButton } from "./LogButton";

async function ThisDeployment() {
  await connection();
  const info = deploymentInfo();
  return (
    <>
      <p>
        You&apos;re looking at a <strong>{info.environment}</strong> deployment
        {info.branch ? <> of branch <code>{info.branch}</code></> : null}
        {info.commit ? <> at commit <code>{info.commit}</code></> : null}.
      </p>
      <JsonView value={info} />
    </>
  );
}

export default function ObservabilityPage() {
  return (
    <FeaturePage
      title="Analytics & Observability"
      tagline="See who visits, how fast it feels, what the code logged, and which deployment is live."
      docs="https://vercel.com/docs/observability"
      whatItIs={<p>
        <strong>Web Analytics</strong> counts page views without cookies. <strong>Speed Insights</strong> measures how fast pages
        feel for real visitors. Both are a component in the root layout, and both are free on Hobby, pausing (never billing) at
        their limits: 50,000 analytics events a month, 10,000 Speed Insights events per 30 days. <strong>Runtime logs</strong>{" "}
        capture whatever functions print. And every git push becomes its own <strong>deployment</strong> with its own URL:
        branches get <strong>preview</strong> deployments, <code>main</code> becomes <strong>production</strong>.
      </p>}
      whenToUse={[
        "Analytics: which pages people actually use",
        "Speed Insights: catching slow pages on real devices",
        "Logs: debugging what happened on a specific request",
        "Preview deployments: reviewing a change on a real URL before merging",
      ]}
    >
      <Demo title="1. This deployment (system environment variables)">
        <Suspense fallback={<p className="muted">Reading deployment info…</p>}>
          <ThisDeployment />
        </Suspense>
        <p className="small muted">
          Open a pull request and its preview deployment shows <code>preview</code> here, with the branch name and a URL of its own.
        </p>
      </Demo>

      <Demo title="2. Runtime logs">
        <p>The button runs a Server Action that prints one JSON line. On Vercel it lands in the runtime logs within seconds.</p>
        <LogButton />
        <p className="small muted">From a terminal: <code>vercel logs vercel-feature-lab.vercel.app</code>.</p>
      </Demo>

      <Demo title="3. Web Analytics and Speed Insights">
        <p>
          <code>&lt;Analytics /&gt;</code> and <code>&lt;SpeedInsights /&gt;</code> are in <code>app/layout.tsx</code>, so every page
          reports. Their scripts load from this site&apos;s own <code>/_vercel/</code> path, so the Content Security Policy needs no
          exceptions. Results appear in the project&apos;s Analytics and Speed Insights tabs.
        </p>
      </Demo>

      <CodePeek file="app/layout.tsx" />
      <CodePeek file="lib/deployment.ts" />
      <CodePeek file="app/observability/actions.ts" />
    </FeaturePage>
  );
}
