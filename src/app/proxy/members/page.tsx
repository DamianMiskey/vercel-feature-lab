import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { currentSession } from "@/lib/current-session";
import { signOut } from "../actions";

// Proxy already let this request through, but the page checks the session
// again before showing anything private: Proxy can be skipped by
// misconfigured matchers, so the data layer must not rely on it alone.
async function Members() {
  const session = await currentSession();
  if (!session) redirect("/proxy?signin=required#auth");
  return (
    <>
      <h1>Welcome, {session.name}</h1>
      <p>
        You got past the Proxy auth gate. Your session cookie is signed, so changing its value (try it in devtools) makes it
        invalid. It expires at <strong className="stamp">{new Date(session.expiresAt).toISOString()}</strong>.
      </p>
      <form action={signOut}>
        <button type="submit" className="ghost">Sign out</button>
      </form>
    </>
  );
}

export default function MembersPage() {
  return (
    <article className="feature">
      <section className="demo">
        <Suspense fallback={<p className="muted">Checking your session…</p>}>
          <Members />
        </Suspense>
        <p><Link href="/proxy">← Back to Proxy</Link></p>
      </section>
    </article>
  );
}
