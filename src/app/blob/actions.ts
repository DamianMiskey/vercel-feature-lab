"use server";

import { del, list, put } from "@vercel/blob";
import { refresh } from "next/cache";
import { currentSession } from "@/lib/current-session";
import { checkLimit, retryIn, writeLimit } from "@/lib/redis";
import { KEEP_UPLOADS, UPLOAD_PREFIX, blobConfigured, checkUpload, uploadPathname } from "@/lib/uploads";

export type UploadState = { message: string; error: boolean } | null;

// Server upload: the file goes browser → this function → Vercel Blob. On
// Vercel the SDK authenticates with the deployment's OIDC token, so there is
// no long-lived Blob token anywhere.
export async function uploadImage(_prev: UploadState, formData: FormData): Promise<UploadState> {
  if (!blobConfigured()) return { message: "Blob isn't connected for this environment.", error: true };
  const session = await currentSession();
  if (!session) return { message: "Sign in first (on the Proxy page): uploads need a lab session.", error: true };

  const check = await checkUpload(formData.get("file"));
  if (!check.ok) return { message: check.error, error: true };

  const limit = await checkLimit(writeLimit);
  if (limit && !limit.success) return { message: `Slow down: try again in ${retryIn(limit.reset)} s.`, error: true };

  const blob = await put(uploadPathname(check.kind.ext), Buffer.from(check.bytes), {
    access: "private",
    contentType: check.kind.type,
  });

  // Keep only the newest uploads, so the store can't grow without bound.
  const { blobs } = await list({ prefix: UPLOAD_PREFIX, limit: 100 });
  const old = blobs.sort((a, b) => +b.uploadedAt - +a.uploadedAt).slice(KEEP_UPLOADS).map((b) => b.pathname);
  if (old.length) await del(old);

  refresh();
  return { message: `Uploaded ${blob.pathname} (${Math.round(check.bytes.length / 1024)} KB, ${check.kind.type}).`, error: false };
}
