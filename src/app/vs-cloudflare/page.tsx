import Link from "next/link";
import { CodePeek } from "@/components/CodePeek";
import { Demo, FeaturePage } from "@/components/FeaturePage";
import { CLOUDFLARE_LAB, cloudflarePages, onlyOnCloudflare, rows } from "@/lib/comparison";
import { getFeature } from "@/lib/features";

const vercelName = (slug: string) => getFeature(slug)?.name ?? slug;
const cfName = (slug: string) => cloudflarePages[slug] ?? slug;

// Fully static: the comparison is content, built once at deploy time.
export default function VsCloudflarePage() {
  return (
    <FeaturePage
      title="Vercel vs Cloudflare"
      tagline="The same jobs on both platforms, side by side with the Cloudflare Feature Lab."
      docs={CLOUDFLARE_LAB}
      whatItIs={<p>
        This lab has a sibling, the <a href={CLOUDFLARE_LAB}>Cloudflare Feature Lab</a>, built to the same pattern: one page per
        feature, each with a live demo and its code. The short version: <strong>Vercel</strong> is a framework-first platform
        (Next.js decides what&apos;s static, cached or dynamic, and storage comes from Marketplace partners), while{" "}
        <strong>Cloudflare</strong> is a primitives-first platform (Workers plus its own storage, queues, state and AI).
      </p>}
      whenToUse={[
        "Vercel: Next.js apps where rendering, caching and previews should just work",
        "Cloudflare: custom backends built from many first-party primitives",
        "Either: both run code close to users and put a free firewall in front",
      ]}
    >
      <Demo title="Feature by feature">
        <table className="table">
          <thead><tr><th>Job</th><th>Vercel lab</th><th>Cloudflare lab</th><th>Difference</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.job}>
                <td><strong>{r.job}</strong></td>
                <td>{r.vercel.map((s, i) => <span key={s}>{i > 0 && ", "}<Link href={`/${s}`}>{vercelName(s)}</Link></span>)}</td>
                <td>{r.cloudflare.map((s, i) => <span key={s}>{i > 0 && ", "}<a href={`${CLOUDFLARE_LAB}/${s}`}>{cfName(s)}</a></span>)}</td>
                <td className="small">{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="small muted">
          Only in the Cloudflare lab: {onlyOnCloudflare.map((s, i) => <span key={s}>{i > 0 && ", "}<a href={`${CLOUDFLARE_LAB}/${s}`}>{cfName(s)}</a></span>)}.
        </p>
      </Demo>

      <CodePeek file="lib/comparison.ts" />
    </FeaturePage>
  );
}
