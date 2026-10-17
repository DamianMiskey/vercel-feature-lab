// Applies db/schema.sql to the database in DATABASE_URL.
//   npm run db:migrate   (reads .env.local)
import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
const sql = neon(process.env.DATABASE_URL);
const schema = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");
const statements = schema.replace(/--.*$/gm, "").split(";").map((s) => s.trim()).filter(Boolean);
for (const statement of statements) {
  await sql.query(statement);
  console.log("✓", statement.split("\n")[0]);
}
