import { cacheLife } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { delay } from "@/lib/delay";

// Prerendered at build time. Other ids are generated on their first visit.
export function generateStaticParams() {
  return [{ id: "1" }, { id: "2" }, { id: "3" }];
}

// Only ids 1–50 exist, so random URLs can't fill the cache.
const isValidId = (id: string) => /^\d+$/.test(id) && Number(id) >= 1 && Number(id) <= 50;

// The slow "database read" is cached per id: the first visit pays for it,
// everyone after gets the cached result. "minutes" regenerates it in the
// background at most once a minute (time-based ISR).
async function getItem(id: string) {
  "use cache";
  cacheLife("minutes");
  await delay(1200);
  return { id, generatedAt: new Date().toISOString() };
}

// Reads params inside <Suspense>, so the page shell can be served instantly
// even for ids that weren't prerendered.
async function Item({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidId(id)) notFound();
  const item = await getItem(id);
  return (
    <>
      <h1>Item {item.id}</h1>
      <p>Generated at <strong className="stamp">{item.generatedAt}</strong></p>
      <p className="muted">Reload: the timestamp stays the same, because this page comes from the cache. After a minute, one reload triggers a background refresh and the next one shows the new time.</p>
    </>
  );
}

export default function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <article className="feature">
      <section className="demo">
        <Suspense fallback={<p className="muted">Generating this item for the first time…</p>}>
          <Item params={params} />
        </Suspense>
        <Link href="/static">← Back to Static &amp; ISR</Link>
      </section>
    </article>
  );
}
