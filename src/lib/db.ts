import { neon } from "@neondatabase/serverless";
import { KEEP_NOTES } from "@/lib/notes";

// Neon Postgres, through the Vercel Marketplace. The serverless driver sends
// each query over HTTPS: no connection pool to manage, which suits functions
// that start and stop. The table is created by db/schema.sql (npm run db:migrate).

export const dbConfigured = () => Boolean(process.env.DATABASE_URL);
export const sql = () => neon(process.env.DATABASE_URL!);

export type Note = { id: string; author: string; body: string; created_at: string };

// Values are passed as template parameters, never pasted into the SQL text,
// so they can't change the query (no SQL injection).
export async function latestNotes(limit = 20) {
  return (await sql()`SELECT id, author, body, created_at FROM lab_notes ORDER BY created_at DESC LIMIT ${limit}`) as Note[];
}

export async function addNote(author: string, body: string) {
  const db = sql();
  await db`INSERT INTO lab_notes (author, body) VALUES (${author}, ${body})`;
  // Keep the table small: only the newest notes survive.
  await db`DELETE FROM lab_notes WHERE id NOT IN (SELECT id FROM lab_notes ORDER BY created_at DESC LIMIT ${KEEP_NOTES})`;
}
