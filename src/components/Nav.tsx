"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { categories, features } from "@/lib/features";

// The sidebar is a Client Component only because it highlights the current
// page (usePathname). Everything else in the lab renders on the server.
export function Nav() {
  const path = usePathname();
  return (
    <nav className="sidebar">
      <Link href="/" className="brand">
        <svg width="22" height="22" viewBox="0 0 76 65" aria-hidden="true"><path d="M37.5 0L75 65H0z" fill="currentColor" /></svg>
        <span>Vercel Lab</span>
      </Link>
      {categories.map((cat) => (
        <div key={cat} className="nav-group">
          <div className="nav-cat">{cat}</div>
          {features.filter((f) => f.category === cat).map((f) => (
            <Link
              key={f.slug}
              href={`/${f.slug}`}
              className={`nav-link${path === `/${f.slug}` ? " active" : ""}${f.ready ? "" : " pending"}`}
            >
              {f.name}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}
