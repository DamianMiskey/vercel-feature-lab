import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { CodePeek } from "@/components/CodePeek";
import { Demo, FeaturePage } from "@/components/FeaturePage";
import { currentSession } from "@/lib/current-session";
import { dbConfigured, latestNotes } from "@/lib/db";
import { KEEP_NOTES } from "@/lib/notes";
import { timed } from "@/lib/timed";
import { NoteForm } from "./NoteForm";

async function Who() {
  const session = await currentSession();
  return session
    ? <p>Signed in as <strong>{session.name}</strong>: your notes are signed with that name.</p>
    : <p className="error">Writing needs a lab session. <Link href="/proxy#auth">Sign in on the Proxy page</Link>, then come back.</p>;
}

// Reads at request time. React escapes every value, so notes can't inject HTML.
async function Notes() {
  await connection();
  if (!dbConfigured()) return <p className="error">Postgres isn&apos;t connected for this environment.</p>;
  const { value: notes, ms } = await timed(() => latestNotes());
  return (
    <>
      <p className="small muted">Query took <strong className="stamp">{ms.toFixed(1)} ms</strong> from the function in {process.env.VERCEL_REGION ?? "local"}.</p>
      {notes.length === 0 ? <p className="muted">No notes yet. Be the first.</p> : (
        <table className="table">
          <thead><tr><th>When (UTC)</th><th>Who</th><th>Note</th></tr></thead>
          <tbody>
            {notes.map((n) => (
              <tr key={n.id}>
                <td className="stamp small">{new Date(n.created_at).toISOString().slice(0, 16).replace("T", " ")}</td>
                <td>{n.author}</td>
                <td>{n.body}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

export default function PostgresPage() {
  return (
    <FeaturePage
      title="Postgres (Neon)"
      tagline="A real SQL database, installed from the Vercel Marketplace."
      docs="https://vercel.com/marketplace/neon"
      whatItIs={<p>
        Vercel doesn&apos;t run databases itself any more: the <strong>Marketplace</strong> installs them from providers, bills
        through Vercel and sets the connection variables on your project. <strong>Neon</strong> is serverless Postgres: storage and
        compute are separate, compute scales to zero when idle, and the <code>@neondatabase/serverless</code> driver sends queries
        over HTTPS, so short-lived functions don&apos;t need a connection pool. This database lives in <code>iad1</code>, the same
        region as the lab&apos;s functions.
      </p>}
      whenToUse={[
        "Relational data: users, orders, anything with joins or transactions",
        "Data that must be consistent and durable",
        "When you want plain SQL, or an ORM like Drizzle or Prisma on top",
      ]}
    >
      <Demo title="1. Write: sign the guestbook (Server Action → INSERT)">
        <Suspense fallback={<p className="muted">Checking your session…</p>}>
          <Who />
        </Suspense>
        <NoteForm />
        <p className="small muted">
          Notes are limited to 280 characters (by the app and again by the table&apos;s <code>CHECK</code> constraints), rate-limited
          with Redis, and only the newest {KEEP_NOTES} are kept.
        </p>
      </Demo>

      <Demo title="2. Read: the latest notes (SELECT)">
        <Suspense fallback={<p className="muted">Querying Postgres…</p>}>
          <Notes />
        </Suspense>
      </Demo>

      <CodePeek file="lib/db.ts" />
      <CodePeek file="app/postgres/actions.ts" />
    </FeaturePage>
  );
}
