import Link from "next/link";
import { categories, features } from "@/lib/features";

export default function Home() {
  const ready = features.filter((f) => f.ready).length;
  return (
    <article>
      <header className="feature-head">
        <h1>Vercel Feature Lab</h1>
        <p className="tagline">
          One page per Vercel and Next.js feature, each with a live demo. The companion to the{" "}
          <a href="https://lab.djmiskey.com">Cloudflare Feature Lab</a>. {ready} of {features.length} built so far.
        </p>
      </header>
      <section className="how">
        <h2>How this app runs</h2>
        <ol>
          <li>A request reaches Vercel&apos;s network, which routes it to this <strong>Next.js</strong> app (App Router).</li>
          <li>Pages are <strong>Server Components</strong>: they render on the server, so they can read headers, secrets and data directly. Only interactive pieces ship JavaScript to the browser.</li>
          <li>With <strong>Cache Components</strong>, each page is a static shell served instantly from the edge, and anything that needs the live request streams in afterwards.</li>
          <li>Back-end code lives in <strong>route handlers</strong> (<code>app/api/*/route.ts</code>) and <strong>Server Functions</strong>, which Vercel runs as serverless functions.</li>
        </ol>
      </section>
      {categories.map((cat) => (
        <section key={cat} className="grid-section">
          <h2>{cat}</h2>
          <div className="grid">
            {features.filter((f) => f.category === cat).map((f) => (
              <Link key={f.slug} href={`/${f.slug}`} className={`tile${f.ready ? "" : " pending"}`}>
                <span className="tile-name">{f.name}</span>
                <span className="tile-sum">{f.summary}</span>
                <span className="badge">{f.ready ? "Live" : `Phase ${f.phase}`}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </article>
  );
}
