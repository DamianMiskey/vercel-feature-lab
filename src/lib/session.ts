// A minimal signed session cookie for the Proxy auth-gate demo:
//   <base64url(name)>.<expiresAt ms>.<base64url(HMAC-SHA256 of the first two parts)>
// Signed with SESSION_SECRET via Web Crypto, so it works in Proxy and in pages.
// A real app would use an auth library; this shows the moving parts.

export const SESSION_COOKIE = "lab-session";
export const SESSION_MAX_AGE = 60 * 60; // seconds

export type Session = { name: string; expiresAt: number };

const encoder = new TextEncoder();

function hmacKey(secret: string) {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function createSession(name: string, secret: string, now = Date.now()) {
  const payload = `${Buffer.from(name).toString("base64url")}.${now + SESSION_MAX_AGE * 1000}`;
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(secret), encoder.encode(payload));
  return `${payload}.${Buffer.from(signature).toString("base64url")}`;
}

// Returns the session if the signature is valid and it hasn't expired.
// crypto.subtle.verify compares in constant time.
export async function readSession(token: string | undefined, secret: string, now = Date.now()): Promise<Session | null> {
  const parts = token?.split(".");
  if (!parts || parts.length !== 3) return null;
  const [name64, expires, signature64] = parts;
  const valid = await crypto.subtle.verify(
    "HMAC",
    await hmacKey(secret),
    Buffer.from(signature64, "base64url"),
    encoder.encode(`${name64}.${expires}`),
  );
  const expiresAt = Number(expires);
  if (!valid || !Number.isFinite(expiresAt) || expiresAt <= now) return null;
  return { name: Buffer.from(name64, "base64url").toString(), expiresAt };
}
