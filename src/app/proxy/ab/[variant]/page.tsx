import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { VARIANTS } from "@/lib/proxy-rules";

// Both variants are prerendered: Proxy only decides which one to serve.
export function generateStaticParams() {
  return VARIANTS.map((variant) => ({ variant }));
}

const copy = {
  // Text colours that keep 4.5:1 contrast in both colour schemes.
  a: { headline: "Ship faster with the Feature Lab", cta: "Start exploring", color: "var(--accent-ink)" },
  b: { headline: "Every Vercel feature, one page at a time", cta: "Take the tour", color: "light-dark(#c2410c, #fb923c)" },
};

async function Variant({ params }: { params: Promise<{ variant: string }> }) {
  const { variant } = await params;
  if (variant !== "a" && variant !== "b") notFound();
  const v = copy[variant];
  return (
    <>
      <p className="small muted">Variant {variant.toUpperCase()}</p>
      <h1>{v.headline}</h1>
      <p><Link href="/" style={{ color: v.color, fontWeight: 650 }}>{v.cta} →</Link></p>
      <p className="muted">
        You were served variant <strong>{variant.toUpperCase()}</strong>. The address bar still says <code>/proxy/ab</code>, and
        the <code>lab-ab</code> cookie keeps you in this bucket for 30 days. Analytics would compare which headline gets more clicks.
      </p>
    </>
  );
}

export default function AbVariantPage({ params }: { params: Promise<{ variant: string }> }) {
  return (
    <article className="feature">
      <section className="demo">
        <Suspense fallback={null}>
          <Variant params={params} />
        </Suspense>
        <Link href="/proxy">← Back to Proxy</Link>
      </section>
    </article>
  );
}
