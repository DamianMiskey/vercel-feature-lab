"use client";

import { useActionState } from "react";
import { MAX_NOTE_LENGTH } from "@/lib/notes";
import { type NoteState, postNote } from "./actions";

export function NoteForm() {
  const [state, action, pending] = useActionState<NoteState, FormData>(postNote, null);
  return (
    <form action={action}>
      <div className="form-row">
        <label className="grow">Your note<input name="body" maxLength={MAX_NOTE_LENGTH} placeholder="Hello from the lab" required /></label>
        <button type="submit" disabled={pending}>{pending ? "Saving…" : "Sign the guestbook"}</button>
      </div>
      {state && <p className={state.error ? "error" : "small"} role="status">{state.message}</p>}
    </form>
  );
}
