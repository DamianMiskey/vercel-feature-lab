import { connection } from "next/server";
import { Suspense } from "react";
import { CodePeek } from "@/components/CodePeek";
import { Demo, FeaturePage } from "@/components/FeaturePage";
import { Counter } from "./Counter";

// Runs on every request: connection() tells Next.js to wait for a real
// request, so the time and the random number are fresh on each reload.
async function requestSnapshot() {
  await connection();
  return { renderedAt: new Date().toISOString(), random: Math.random().toFixed(6) };
}

async function PerRequest() {
  const { renderedAt, random } = await requestSnapshot();
  return (
    <div className="cells">
      <div className="cell"><span className="small muted">Rendered at</span><strong className="stamp">{renderedAt}</strong></div>
      <div className="cell"><span className="small muted">Random number</span><strong className="stamp">{random}</strong></div>
      <div className="cell"><span className="small muted">Function region</span><strong>{process.env.VERCEL_REGION ?? "local"}</strong></div>
    </div>
  );
}

// searchParams is request data too, so the component that reads it sits
// inside <Suspense>. The page only passes the promise down.
async function Greeting({ searchParams }: { searchParams: Promise<{ name?: string | string[] }> }) {
  const { name } = await searchParams;
  const value = (Array.isArray(name) ? name[0] : name)?.trim().slice(0, 40);
  // React escapes the value, so it's safe to render user input as text.
  return <p>{value ? <>Hello, <strong>{value}</strong>. This sentence was rendered on the server for your URL.</> : "Type a name and submit: the form reloads the page with ?name=… and the server renders the greeting."}</p>;
}

// A Server Component: its code (and anything it imports) stays on the server.
// Only the HTML it renders, plus the props for <Counter>, reach the browser.
async function ServerFacts() {
  await connection();
  return (
    <>
      <p>
        This text was produced by Node.js <code>{process.version}</code> on the server. The counter below is a Client
        Component: its JavaScript is sent to the browser so it can respond to clicks. It starts at a number the server picked.
      </p>
      <Counter start={new Date().getSeconds()} />
    </>
  );
}

export default function SsrPage({ searchParams }: { searchParams: Promise<{ name?: string | string[] }> }) {
  return (
    <FeaturePage
      title="Server rendering"
      tagline="Render HTML on the server for each request, with React Server Components."
      docs="https://nextjs.org/docs/app/getting-started/server-and-client-components"
      whatItIs={<p>
        In the App Router every component is a <strong>Server Component</strong> unless the file says <code>&quot;use client&quot;</code>.
        Server Components run on the server (a Vercel Function), can read data and secrets directly, and send only HTML to the browser.
        With <strong>Cache Components</strong> there&apos;s no page-wide &quot;dynamic&quot; switch: the parts that need the live request
        (<code>connection()</code>, <code>headers()</code>, <code>searchParams</code>) go inside <code>&lt;Suspense&gt;</code> and render
        per request, while the rest of the page is prerendered.
      </p>}
      whenToUse={[
        "Pages that depend on who is asking: dashboards, search results, carts",
        "Data that must be fresh on every request",
        "Keeping heavy libraries and secrets off the client",
      ]}
    >
      <Demo title="1. Rendered per request">
        <p>Reload the page: these values change every time, because they&apos;re computed while handling your request.</p>
        <Suspense fallback={<p className="muted">Rendering…</p>}>
          <PerRequest />
        </Suspense>
      </Demo>

      <Demo title="2. Rendering from the URL (searchParams)">
        <form className="form-row" action="/ssr">
          <label className="grow">Your name<input name="name" maxLength={40} placeholder="Ada" /></label>
          <button type="submit">Render on the server</button>
        </form>
        <Suspense fallback={<p className="muted">Reading the URL…</p>}>
          <Greeting searchParams={searchParams} />
        </Suspense>
        <p className="small muted">A plain HTML form with <code>method=&quot;get&quot;</code>: it works with JavaScript turned off.</p>
      </Demo>

      <Demo title="3. Server and Client Components together">
        <Suspense fallback={<p className="muted">Rendering…</p>}>
          <ServerFacts />
        </Suspense>
      </Demo>

      <CodePeek file="app/ssr/page.tsx" />
      <CodePeek file="app/ssr/Counter.tsx" />
    </FeaturePage>
  );
}
