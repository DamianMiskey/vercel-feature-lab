// Pull the interesting parts out of a request's headers. Used by the basics
// page (Server Component) and the /api/basics/inspect route handler, so both
// show exactly the same thing.

// Vercel adds these geo headers to every request it routes. Locally they're
// missing, so the lab shows "local".
const GEO = {
  country: "x-vercel-ip-country",
  region: "x-vercel-ip-country-region",
  city: "x-vercel-ip-city",
  latitude: "x-vercel-ip-latitude",
  longitude: "x-vercel-ip-longitude",
  timezone: "x-vercel-ip-timezone",
  postalCode: "x-vercel-ip-postal-code",
} as const;

export function geoFrom(headers: Headers) {
  const geo: Record<string, string | null> = {};
  for (const [key, header] of Object.entries(GEO)) {
    const value = headers.get(header);
    // City names arrive URL-encoded (e.g. "S%C3%A3o%20Paulo").
    geo[key] = value && key === "city" ? decodeURIComponent(value) : value;
  }
  return geo;
}

export function requestInfo(headers: Headers) {
  // x-vercel-id looks like "cpt1::iad1::abc123-…": the edge region that
  // received the request, then the region where the function ran.
  const vercelId = headers.get("x-vercel-id");
  const [edgeRegion, functionRegion] = vercelId?.split("::") ?? [];
  return {
    host: headers.get("host"),
    userAgent: headers.get("user-agent"),
    acceptLanguage: headers.get("accept-language"),
    forwardedFor: headers.get("x-forwarded-for"),
    vercelId,
    edgeRegion: vercelId ? edgeRegion : null,
    functionRegion: vercelId ? functionRegion : null,
    onVercel: Boolean(vercelId),
    geo: geoFrom(headers),
  };
}
