import { cookies, headers } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";
import { CodePeek } from "@/components/CodePeek";
import { Demo, FeaturePage } from "@/components/FeaturePage";
import { AB_COOKIE } from "@/lib/proxy-rules";
import { signIn } from "./actions";

// Request headers that src/proxy.ts added before this page ran.
async function FromProxy() {
  const h = await headers();
  return (
    <div className="cells">
      <div className="cell"><span className="small muted">x-lab-country</span><strong>{h.get("x-lab-country") ?? "(missing)"}</strong></div>
      <div className="cell"><span className="small muted">x-lab-proxy-at</span><strong className="stamp">{h.get("x-lab-proxy-at") ?? "(missing)"}</strong></div>
    </div>
  );
}

async function CurrentBucket() {
  const bucket = (await cookies()).get(AB_COOKIE)?.value;
  return <p>Your bucket: <strong>{bucket ? bucket.toUpperCase() : "none yet"}</strong>{bucket ? " (from the lab-ab cookie)" : ": visit the test to get one"}.</p>;
}

const signinNotices: Record<string, string> = {
  required: "The proxy sent you back here: the members area needs a session. Sign in first.",
  unavailable: "Sign-in is switched off: SESSION_SECRET isn't set for this deployment.",
};

async function SigninNotice({ searchParams }: { searchParams: Promise<{ signin?: string | string[] }> }) {
  const { signin } = await searchParams;
  const notice = typeof signin === "string" ? signinNotices[signin] : undefined;
  return notice ? <p className="error" role="alert">{notice}</p> : null;
}

export default function ProxyPage({ searchParams }: { searchParams: Promise<{ signin?: string | string[] }> }) {
  return (
    <FeaturePage
      title="Proxy (middleware)"
      tagline="Run code before the page: rewrite, redirect or add headers based on the request."
      docs="https://nextjs.org/docs/app/getting-started/proxy"
      whatItIs={<p>
        <code>src/proxy.ts</code> (called <strong>Middleware</strong> before Next.js 16) runs before routing, for every path its{" "}
        <code>matcher</code> selects. It sees the request (URL, cookies, headers, Vercel&apos;s geo headers) and can{" "}
        <strong>rewrite</strong> to a different page under the same URL, <strong>redirect</strong>, set cookies, or add headers.
        Because a rewrite can point at a prerendered page, personalised routing doesn&apos;t cost you the static cache.
      </p>}
      whenToUse={[
        "A/B tests and experiments that pick between static pages",
        "Geo or language routing",
        "Quick auth checks that send signed-out visitors to a login page",
        "Adding headers to a group of routes",
      ]}
    >
      <Demo title="1. Headers added by Proxy">
        <p>
          Proxy copies the request headers and adds two of its own before this page renders. It also sets an{" "}
          <code>x-lab-proxy</code> response header with the rule it ran and how long it took: look for it in your browser&apos;s
          network tab.
        </p>
        <Suspense fallback={<p className="muted">Reading headers…</p>}>
          <FromProxy />
        </Suspense>
      </Demo>

      <Demo title="2. A/B test with a rewrite">
        <p>
          <Link href="/proxy/ab">/proxy/ab</Link> has no page of its own. Proxy picks bucket A or B at random, saves it in a cookie
          so you keep seeing the same one, and rewrites to one of two prerendered variants. The address bar keeps saying{" "}
          <code>/proxy/ab</code>.
        </p>
        <Suspense fallback={<p className="muted">Reading cookie…</p>}>
          <CurrentBucket />
        </Suspense>
        <p className="small muted">
          Switch bucket: <Link href="/proxy/ab?variant=a">?variant=a</Link> · <Link href="/proxy/ab?variant=b">?variant=b</Link>
        </p>
      </Demo>

      <Demo title="3. Geo routing">
        <p>
          <Link href="/proxy/geo">/proxy/geo</Link> is rewritten to a page for your country, read from Vercel&apos;s{" "}
          <code>x-vercel-ip-country</code> header. Locally there&apos;s no such header, so try{" "}
          <Link href="/proxy/geo?country=JP">?country=JP</Link> or <Link href="/proxy/geo?country=ZA">?country=ZA</Link>.
        </p>
      </Demo>

      <Demo title="4. Auth gate">
        <span id="auth" />
        <p>
          <Link href="/proxy/members">/proxy/members</Link> is gated: Proxy checks for a signed session cookie and redirects you
          back here without one. Sign in with any name to get a cookie signed with <code>SESSION_SECRET</code> (HMAC-SHA256,
          httpOnly, one hour).
        </p>
        <Suspense fallback={null}>
          <SigninNotice searchParams={searchParams} />
        </Suspense>
        <form className="form-row" action={signIn}>
          <label className="grow">Name<input name="name" maxLength={30} placeholder="Ada" required /></label>
          <button type="submit">Sign in</button>
        </form>
      </Demo>

      <CodePeek file="proxy.ts" />
      <CodePeek file="lib/proxy-rules.ts" />
      <CodePeek file="lib/session.ts" />
      <CodePeek file="app/proxy/actions.ts" />
    </FeaturePage>
  );
}
