"use server";

import { refresh } from "next/cache";
import { currentSession } from "@/lib/current-session";
import { addNote, dbConfigured } from "@/lib/db";
import { checkNote } from "@/lib/notes";
import { checkLimit, retryIn, writeLimit } from "@/lib/redis";

export type NoteState = { message: string; error: boolean } | null;

export async function postNote(_prev: NoteState, formData: FormData): Promise<NoteState> {
  if (!dbConfigured()) return { message: "Postgres isn't connected for this environment.", error: true };
  const session = await currentSession();
  if (!session) return { message: "Sign in first (on the Proxy page): notes are signed with your lab name.", error: true };

  const note = checkNote(formData.get("body"));
  if (!note.ok) return { message: note.error, error: true };

  const limit = await checkLimit(writeLimit);
  if (limit && !limit.success) return { message: `Slow down: try again in ${retryIn(limit.reset)} s.`, error: true };

  await addNote(session.name, note.body);
  refresh();
  return { message: "Saved.", error: false };
}
