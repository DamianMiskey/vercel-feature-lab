import Link from "next/link";

// Behind a Firewall "challenge" rule (vercel.json): on Vercel, browsers see a
// short automatic check before this page; scripts that can't run it never
// reach it. Locally there's no firewall, so the page just loads.
export default function ChallengePassed() {
  return (
    <article className="feature">
      <section className="demo">
        <h1>Challenge passed</h1>
        <p>
          The Vercel Firewall checked your browser before letting this request through. Challenged requests that fail never reach
          the app and aren&apos;t billed.
        </p>
        <Link href="/security">← Back to Security</Link>
      </section>
    </article>
  );
}
