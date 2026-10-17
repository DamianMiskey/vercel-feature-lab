"use client";

import { useActionState } from "react";
import { type UploadState, uploadImage } from "./actions";

// useActionState runs the Server Action and keeps its last result, so the
// form can show success or the reason an upload was refused.
export function UploadForm() {
  const [state, action, pending] = useActionState<UploadState, FormData>(uploadImage, null);
  return (
    <form action={action}>
      <div className="form-row">
        <label className="grow">Image (PNG, JPEG, GIF or WebP, up to 900 KB)
          <input type="file" name="file" accept="image/png,image/jpeg,image/gif,image/webp" required />
        </label>
        <button type="submit" disabled={pending}>{pending ? "Uploading…" : "Upload"}</button>
      </div>
      {state && <p className={state.error ? "error" : "small"} role="status">{state.message}</p>}
    </form>
  );
}
