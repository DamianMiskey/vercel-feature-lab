// Guestbook rules, shared by the server and the browser form (so this file
// must not import the database driver).

export const MAX_NOTE_LENGTH = 280;
export const KEEP_NOTES = 50;

// Trims, removes control characters (newlines included: notes are one line)
// and enforces the same length limits as the table's CHECK constraints.
export function checkNote(raw: FormDataEntryValue | null): { ok: true; body: string } | { ok: false; error: string } {
  const body = String(raw ?? "").replace(/[\u0000-\u001f\u007f]+/g, " ").trim();
  if (!body) return { ok: false, error: "Write something first." };
  if (body.length > MAX_NOTE_LENGTH) return { ok: false, error: `Notes are limited to ${MAX_NOTE_LENGTH} characters.` };
  return { ok: true, body };
}
