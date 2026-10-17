import { connection } from "next/server";
import { Suspense } from "react";
import { CodePeek } from "@/components/CodePeek";
import { Demo, FeaturePage } from "@/components/FeaturePage";
import { CRON_PATH, CRON_SCHEDULE, RETENTION_DAYS, recentRuns } from "@/lib/housekeeping";
import { redisConfigured } from "@/lib/redis";

async function Runs() {
  await connection();
  if (!redisConfigured()) return <p className="error">Redis isn&apos;t connected, so runs aren&apos;t recorded here.</p>;
  const runs = await recentRuns();
  if (!runs.length) return <p className="muted">No runs recorded yet. The first scheduled run is tonight around 03:00 UTC.</p>;
  return (
    <table className="table">
      <thead><tr><th>When (UTC)</th><th>Trigger</th><th>Notes deleted</th><th>Uploads deleted</th><th>Took</th></tr></thead>
      <tbody>
        {runs.map((r) => (
          <tr key={r.at}>
            <td className="stamp small">{r.at.slice(0, 19).replace("T", " ")}</td>
            <td>{r.trigger}</td>
            <td>{r.notesDeleted}</td>
            <td>{r.blobsDeleted}</td>
            <td className="stamp">{r.ms} ms</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function CronPage() {
  return (
    <FeaturePage
      title="Cron Jobs"
      tagline="Call a route on a schedule: cleanups, reports, syncs."
      docs="https://vercel.com/docs/cron-jobs"
      whatItIs={<p>
        A <strong>Cron Job</strong> is a schedule in <code>vercel.json</code> that makes Vercel send a <code>GET</code> request to
        one of your routes, on production deployments only. The route is an ordinary Vercel Function, so it can use everything else
        in the lab. Because the URL is public, Vercel adds <code>Authorization: Bearer $CRON_SECRET</code> and the route rejects
        requests without it. On the Hobby plan a job can run at most once a day, at some point within the scheduled hour.
      </p>}
      whenToUse={[
        "Cleaning up old data and files",
        "Sending daily digests or reports",
        "Syncing with an outside system on a timer",
      ]}
    >
      <Demo title="1. The job">
        <div className="cells">
          <div className="cell"><span className="small muted">Route</span><strong><code>{CRON_PATH}</code></strong></div>
          <div className="cell"><span className="small muted">Schedule</span><strong><code>{CRON_SCHEDULE}</code></strong><span className="small muted">daily, 03:00 UTC</span></div>
          <div className="cell"><span className="small muted">Does</span><strong>Deletes notes and uploads older than {RETENTION_DAYS} days</strong></div>
        </div>
        <p className="small muted">
          Run it now from a terminal: <code>vercel crons run {CRON_PATH}</code>. Without the secret, the route answers 401.
        </p>
      </Demo>

      <Demo title="2. Recent runs (recorded in Redis)">
        <Suspense fallback={<p className="muted">Loading runs…</p>}>
          <Runs />
        </Suspense>
      </Demo>

      <CodePeek file="app/api/cron/cleanup/route.ts" />
      <CodePeek file="lib/housekeeping.ts" />
    </FeaturePage>
  );
}
