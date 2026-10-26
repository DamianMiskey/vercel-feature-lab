import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Suspense } from "react";
import { THEME_SCRIPT } from "@djmiskey/lab-tokens/theme";
import { Nav } from "@/components/Nav";
import "@djmiskey/lab-tokens/tokens.css";
import "@djmiskey/lab-tokens/theme-switch.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vercel Feature Lab",
  description: "One page per Vercel and Next.js feature, each with a live demo.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: the theme script sets data-theme before React loads.
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Applies the visitor's theme before the first paint, so there's no flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <div className="shell">
          <Nav />
          <main className="content">{children}</main>
        </div>
        {/* Web Analytics (page views) and Speed Insights (real-user performance).
            Both load their script from this site's /_vercel/ path, so the CSP
            needs no exceptions. They read the URL's search params, which
            Cache Components requires inside a Suspense boundary. */}
        <Suspense fallback={null}>
          <Analytics />
          <SpeedInsights />
        </Suspense>
      </body>
    </html>
  );
}
