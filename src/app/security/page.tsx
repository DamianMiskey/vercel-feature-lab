import { headers } from "next/headers";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { CodePeek } from "@/components/CodePeek";
import { Demo, FeaturePage } from "@/components/FeaturePage";
import { recentViolations } from "@/lib/csp-reports";
import { BotCheck } from "./BotCheck";
import { CspCheck } from "./CspCheck";

// Rendered per request: the nonce Proxy generated is different every time.
async function StrictCsp() {
  const h = await headers();
  const nonce = h.get("x-nonce") ?? "";
  const policy = h.get("content-security-policy") ?? "(none: Proxy didn't run)";
  return (
    <>
      {/* The page's own script: carries the nonce, so the browser runs it. */}
      <script nonce={nonce} dangerouslySetInnerHTML={{ __html: "window.__lab=Object.assign(window.__lab||{},{nonced:true})" }} />
      {/* Stand-in for injected code (an XSS): no nonce, so the browser refuses it and reports the violation. */}
      <script dangerouslySetInnerHTML={{ __html: "window.__lab=Object.assign(window.__lab||{},{injected:true})" }} />
      <CspCheck />
      <p className="small muted">This response&apos;s policy (the nonce changes on every reload):</p>
      <pre className="json">{policy.replaceAll("; ", ";\n")}</pre>
    </>
  );
}

async function Violations() {
  await connection();
  const reports = await recentViolations();
  if (!reports.length) return <p className="muted small">No violation reports yet. They arrive a moment after the page loads; reload to see them.</p>;
  return (
    <table className="table">
      <thead><tr><th>When (UTC)</th><th>Directive</th><th>Blocked</th><th>Sample</th></tr></thead>
      <tbody>
        {reports.map((r, i) => (
          <tr key={`${r.at}-${i}`}>
            <td className="stamp small">{r.at.slice(11, 19)}</td>
            <td><code>{r.directive}</code></td>
            <td>{r.blocked}</td>
            <td className="small"><code>{r.sample}</code></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// No static shell for this page. A prerendered shell's scripts are built
// ahead of time without a nonce, so the strict policy would block them and
// the page would never start. Instead the whole page waits for the request
// (connection() outside any Suspense), and Next.js adds the nonce to every
// script. instant = false allows a route without a static shell.
export const instant = false;

export default async function SecurityPage() {
  await connection();
  return (
    <FeaturePage
      title="Security"
      tagline="Content Security Policy, the Vercel Firewall and BotID: everything here is free on the Hobby plan."
      docs="https://vercel.com/docs/vercel-firewall"
      whatItIs={<p>
        Three layers. A <strong>Content Security Policy</strong> tells the browser which scripts and resources it may load, so
        injected code can&apos;t run. The <strong>Vercel Firewall</strong> filters requests before they reach your code: custom rules
        can deny or challenge them, and blocked traffic isn&apos;t billed. <strong>BotID</strong> is an invisible CAPTCHA: the page
        solves a challenge in the background and the server checks the result before doing anything expensive.
      </p>}
      whenToUse={[
        "CSP: every site, as defence in depth against XSS",
        "Firewall rules: blocking scanners, challenging suspicious paths",
        "BotID: signups, checkouts, AI endpoints and other forms bots love",
      ]}
    >
      <Demo title="1. Strict CSP with a nonce (this page)">
        <p>
          Proxy gives this page a fresh <strong>nonce</strong> on every request, and the policy only lets scripts carrying it run
          (<code>&apos;strict-dynamic&apos;</code> extends that trust to scripts they load). The page renders two inline scripts:
        </p>
        <Suspense fallback={<p className="muted">Applying the policy…</p>}>
          <StrictCsp />
        </Suspense>
        <p className="small muted">
          Why not everywhere? Nonces only work on pages rendered per request. The rest of the lab is prerendered (Partial
          Prerendering), so it uses a site-wide policy from <code>next.config.ts</code> that locks everything to this site but
          must allow inline scripts.
        </p>
      </Demo>

      <Demo title="2. Violation reports">
        <p>When the policy blocks something, the browser reports it to <code>/api/security/csp-report</code>. The latest ten:</p>
        <Suspense fallback={<p className="muted">Loading reports…</p>}>
          <Violations />
        </Suspense>
      </Demo>

      <Demo title="3. Firewall rules (vercel.json)">
        <p>Two custom rules run on Vercel&apos;s network, before any function. They only apply on deployments, not locally.</p>
        <ul>
          <li><strong>Deny</strong> scanner paths: <Link href="/wp-admin" prefetch={false}>/wp-admin</Link>, <code>/.env</code>, <code>/.git</code>… → 403 with no function call.</li>
          <li><strong>Challenge</strong>: <Link href="/security/challenge" prefetch={false}>/security/challenge</Link> shows Vercel&apos;s browser check first.</li>
        </ul>
      </Demo>

      <Demo title="4. BotID (Basic)">
        <p>The endpoint below and the guestbook on <Link href="/postgres">/postgres</Link> run <code>checkBotId()</code>. From this page you pass; with <code>curl</code> you get 403.</p>
        <BotCheck />
      </Demo>

      <CodePeek file="lib/proxy-rules.ts" />
      <CodePeek file="instrumentation-client.ts" />
      <CodePeek file="lib/botid.ts" />
    </FeaturePage>
  );
}
