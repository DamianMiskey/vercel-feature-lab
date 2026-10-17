import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Nav } from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vercel Feature Lab",
  description: "One page per Vercel and Next.js feature, each with a live demo.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
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
