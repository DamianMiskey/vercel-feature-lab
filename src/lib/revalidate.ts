import { timingSafeEqual } from "node:crypto";

// The cache tag shared by the on-demand demo on /static and the revalidation
// webhook (app/api/static/revalidate/route.ts).
export const ON_DEMAND_TAG = "static-on-demand";

// Checks an `Authorization: Bearer <secret>` header in constant time, so the
// response time doesn't leak how much of the secret was right.
export function isAuthorized(header: string | null, secret: string) {
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(header ?? "");
  return given.length === expected.length && timingSafeEqual(given, expected);
}
