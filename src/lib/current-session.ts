import { cookies } from "next/headers";
import { SESSION_COOKIE, readSession } from "@/lib/session";

// The signed-in visitor for this request, or null. Used by every page and
// route that needs the lab session (it never trusts Proxy to have checked).
export async function currentSession() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  return readSession((await cookies()).get(SESSION_COOKIE)?.value, secret);
}
