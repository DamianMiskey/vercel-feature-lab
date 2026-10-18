import { list } from "@vercel/blob";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { CodePeek } from "@/components/CodePeek";
import { Demo, FeaturePage } from "@/components/FeaturePage";
import { currentSession } from "@/lib/current-session";
import { KEEP_UPLOADS, UPLOAD_PREFIX, blobConfigured } from "@/lib/uploads";
import { UploadForm } from "./UploadForm";

async function Who() {
  const session = await currentSession();
  return session
    ? <p>Signed in as <strong>{session.name}</strong>: you can upload and see the gallery.</p>
    : <p className="error">Uploads need a lab session. <Link href="/proxy#auth">Sign in on the Proxy page</Link> (any name), then come back.</p>;
}

// Lists the store at request time. Images are shown through /api/blob/[name],
// the only way to read a private blob.
async function Gallery() {
  await connection();
  if (!blobConfigured()) return <p className="error">Blob isn&apos;t connected for this environment.</p>;
  // A missing or expired token (the OIDC token lasts ~12 hours locally) or a
  // Blob outage shouldn't take the whole page down.
  const listed = await list({ prefix: UPLOAD_PREFIX, limit: 100 }).catch((error: Error) => error);
  if (listed instanceof Error) return <p className="error">Blob couldn&apos;t be reached: {listed.message.split(". ")[0]}.</p>;
  const [session, { blobs }] = [await currentSession(), listed];
  const newest = blobs.sort((a, b) => +b.uploadedAt - +a.uploadedAt).slice(0, KEEP_UPLOADS);
  if (!newest.length) return <p className="muted">No uploads yet.</p>;
  if (!session) return <p className="muted">{newest.length} image{newest.length === 1 ? "" : "s"} in the store. Sign in to see them.</p>;
  return (
    <div className="cells">
      {newest.map((b) => {
        const name = b.pathname.slice(UPLOAD_PREFIX.length);
        return (
          <figure key={b.pathname} className="cell" style={{ margin: 0 }}>
            {/* A plain <img>: the Image Optimizer fetches without the visitor's cookie, so it can't read a private blob. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/blob/${name}`} alt={`Upload ${name}`} loading="lazy" style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 6 }} />
            <figcaption className="small muted">{Math.round(b.size / 1024)} KB · <span className="stamp">{b.uploadedAt.toISOString().slice(0, 16).replace("T", " ")}</span></figcaption>
          </figure>
        );
      })}
    </div>
  );
}

export default function BlobPage() {
  return (
    <FeaturePage
      title="Vercel Blob"
      tagline="Store files on Vercel: uploads, images, documents. Public or private."
      docs="https://vercel.com/docs/vercel-blob"
      whatItIs={<p>
        <strong>Vercel Blob</strong> is file storage for your project. <code>put()</code> uploads, <code>list()</code> and{" "}
        <code>head()</code> read metadata, <code>get()</code> streams a file, <code>del()</code> removes it. A{" "}
        <strong>public</strong> store gives every file a CDN URL. This lab uses a <strong>private</strong> store: files have no
        public URL, so they can only be read by your own code, which decides who sees what. On Vercel the SDK signs in with the
        deployment&apos;s short-lived <strong>OIDC</strong> token, so no long-lived storage key exists to leak.
      </p>}
      whenToUse={[
        "User uploads: avatars, attachments, documents",
        "Private files served only to the right people",
        "Generated files: exports, reports, images",
      ]}
    >
      <Demo title="1. Upload (Server Action)">
        <Suspense fallback={<p className="muted">Checking your session…</p>}>
          <Who />
        </Suspense>
        <UploadForm />
        <p className="small muted">
          The server checks the file&apos;s first bytes (not its name), names it with a random id, and keeps only the newest{" "}
          {KEEP_UPLOADS} uploads. Anything bigger than 4.5 MB would need a <em>client upload</em>, straight from the browser to Blob.
        </p>
      </Demo>

      <Demo title="2. Private gallery">
        <p>Each image is streamed by a route handler that checks your session first. Try opening one in a private window: 401.</p>
        <Suspense fallback={<p className="muted">Listing the store…</p>}>
          <Gallery />
        </Suspense>
      </Demo>

      <CodePeek file="app/blob/actions.ts" />
      <CodePeek file="app/api/blob/[name]/route.ts" />
      <CodePeek file="lib/uploads.ts" />
    </FeaturePage>
  );
}
