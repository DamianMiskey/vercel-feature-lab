"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_MAX_AGE, createSession } from "@/lib/session";

// Sign in to the demo members area: no password, just a name, so the page can
// show the signed cookie at work. The cookie is httpOnly (no JavaScript access)
// and sent site-wide: the Proxy auth gate and the Blob uploads both use it.
export async function signIn(formData: FormData) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) redirect("/proxy?signin=unavailable#auth");
  const name = String(formData.get("name") ?? "").trim().slice(0, 30) || "guest";
  (await cookies()).set(SESSION_COOKIE, await createSession(name, secret), {
    path: "/",
    maxAge: SESSION_MAX_AGE,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  redirect("/proxy/members");
}

export async function signOut() {
  (await cookies()).delete({ name: SESSION_COOKIE, path: "/" });
  redirect("/proxy#auth");
}
