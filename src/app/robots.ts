import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Feature pages are open to crawlers. Routes with nothing to index are not:
// API endpoints, the signed-in members area, Proxy rewrite targets (their
// real pages are /proxy/ab/a, /proxy/geo/ZA… under a different URL) and the
// Firewall challenge demo. robots.txt is a request, not access control: the
// private parts are protected by the session, BotID and the Firewall.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/proxy/members", "/proxy/ab", "/proxy/geo", "/security/challenge"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
