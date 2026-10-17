import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

// A few countries are prerendered; any other valid code is generated on its
// first visit and cached. Proxy only ever rewrites to two-letter codes or XX.
export function generateStaticParams() {
  return ["XX", "ZA", "US", "GB", "DE", "FR", "JP"].map((country) => ({ country }));
}

const greetings: Record<string, string> = {
  ZA: "Howzit", US: "Hey there", GB: "Hiya", DE: "Hallo", FR: "Bonjour", JP: "こんにちは",
  ES: "Hola", NL: "Hoi", BR: "Olá", IT: "Ciao", SE: "Hej", KE: "Jambo",
};

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

async function Greeting({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  if (!/^[A-Z]{2}$/.test(country)) notFound();
  if (country === "XX") {
    return (
      <>
        <h1>Hello, wherever you are</h1>
        <p className="muted">
          There was no <code>x-vercel-ip-country</code> header, which happens when running locally. Add <code>?country=JP</code> to
          the URL to pretend.
        </p>
      </>
    );
  }
  return (
    <>
      <h1>{greetings[country] ?? "Hello"}, {regionNames.of(country) ?? country}!</h1>
      <p className="muted">
        Proxy read country <code>{country}</code> and rewrote <code>/proxy/geo</code> to <code>/proxy/geo/{country}</code>. Each
        country page is static, so the personalisation costs nothing at request time.
      </p>
    </>
  );
}

export default function GeoPage({ params }: { params: Promise<{ country: string }> }) {
  return (
    <article className="feature">
      <section className="demo">
        <Suspense fallback={null}>
          <Greeting params={params} />
        </Suspense>
        <Link href="/proxy">← Back to Proxy</Link>
      </section>
    </article>
  );
}
