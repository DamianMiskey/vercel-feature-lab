import Link from "next/link";
import { notFound } from "next/navigation";
import { features, getFeature } from "@/lib/features";

// Placeholder pages for features from later phases. Built pages (like
// /basics) have their own folder, which takes priority over this dynamic route.
export function generateStaticParams() {
  return features.filter((f) => !f.ready).map((f) => ({ slug: f.slug }));
}

export default async function Planned({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const feature = getFeature(slug);
  if (!feature || feature.ready) notFound();
  return (
    <article className="feature">
      <header className="feature-head">
        <h1>{feature.name}</h1>
        <p className="tagline">{feature.summary}</p>
      </header>
      <section className="demo">
        <h2>Coming in phase {feature.phase}</h2>
        <p>This feature isn&apos;t built yet. See the roadmap in the README.</p>
        <Link href="/">← Back to all features</Link>
      </section>
    </article>
  );
}
