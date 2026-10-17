import { connection } from "next/server";
import { Suspense } from "react";
import { CodePeek } from "@/components/CodePeek";
import { Demo, FeaturePage } from "@/components/FeaturePage";
import { recentAfter } from "@/lib/after-log";
import { redisConfigured } from "@/lib/redis";
import { AfterButton } from "./AfterButton";

async function Log() {
  await connection();
  if (!redisConfigured()) return <p className="error">Redis isn&apos;t connected, so the log isn&apos;t kept.</p>;
  const entries = await recentAfter();
  if (!entries.length) return <p className="muted">Nothing yet. Start a job above.</p>;
  return (
    <table className="table">
      <thead><tr><th>Job</th><th>Response sent (UTC)</th><th>Work finished</th></tr></thead>
      <tbody>
        {entries.map((e) => (
          <tr key={e.id}>
            <td><code>{e.id}</code></td>
            <td className="stamp small">{new Date(e.respondedAt).toISOString().slice(11, 23)}</td>
            <td className="stamp">{((e.finishedAt - e.respondedAt) / 1000).toFixed(2)} s later</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function AfterPage() {
  return (
    <FeaturePage
      title="after()"
      tagline="Send the response first, then finish the slow work."
      docs="https://nextjs.org/docs/app/api-reference/functions/after"
      whatItIs={<p>
        <code>after(callback)</code> from <code>next/server</code> schedules work to run once the response has been sent. The
        visitor gets their answer straight away, and on Vercel the function stays alive until the callback finishes (up to the
        route&apos;s maximum duration). It works in Server Components, Server Actions, route handlers and Proxy, and runs even if
        the response failed.
      </p>}
      whenToUse={[
        "Logging and analytics that shouldn't slow the page",
        "Sending emails or webhooks after a form is saved",
        "Warming or updating caches after a change",
      ]}
    >
      <Demo title="1. A Server Action with background work">
        <p>The action answers at once. The work it hands to <code>after()</code> takes 2 seconds and writes to the log when done.</p>
        <AfterButton />
      </Demo>

      <Demo title="2. Finished work (recorded in Redis)">
        <Suspense fallback={<p className="muted">Loading the log…</p>}>
          <Log />
        </Suspense>
      </Demo>

      <CodePeek file="app/after/actions.ts" />
      <CodePeek file="app/after/AfterButton.tsx" />
    </FeaturePage>
  );
}
