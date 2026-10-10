"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** A shortcut back to the dashboard on every inner page. Not shown on the dashboard itself or the sign-in page. */
export default function BackToDashboard() {
  const path = usePathname();
  if (path === "/" || path.startsWith("/signin")) return null;
  return (
    <nav aria-label="Back to dashboard" className="no-print mb-4">
      <Link href="/" className="inline-flex items-center gap-1.5 rounded-md border border-rule bg-card px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent-bg">
        <span aria-hidden="true">←</span> Back to dashboard
      </Link>
    </nav>
  );
}
