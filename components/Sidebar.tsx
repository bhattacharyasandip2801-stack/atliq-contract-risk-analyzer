"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole } from "./RoleProvider";
import RoleSwitch from "./RoleSwitch";

const I = (d: string) => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);
const ICON = {
  queue: I("M4 6h16M4 12h16M4 18h10"),
  register: I("M5 4h10l4 4v12H5zM14 4v5h5M8 13h8M8 17h8"),
  decisions: I("M5 12l4 4 10-10"),
  eval: I("M5 20V10M12 20V4M19 20v-7"),
  audit: I("M12 8v5l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z"),
};
const ITEMS: { href: string; label: string; icon: keyof typeof ICON; reviewerOnly?: boolean }[] = [
  { href: "/", label: "Contract queue", icon: "queue" },
  { href: "/register", label: "Obligation register", icon: "register", reviewerOnly: true },
  { href: "/decisions", label: "Decisions", icon: "decisions", reviewerOnly: true },
  { href: "/evaluation", label: "Evaluation", icon: "eval", reviewerOnly: true },
  { href: "/audit", label: "Audit log", icon: "audit" },
];

export default function Sidebar() {
  const path = usePathname();
  const role = useRole();
  const items = ITEMS.filter((i) => !i.reviewerOnly || role === "reviewer");
  const active = (href: string) => (href === "/" ? path === "/" || path.startsWith("/brief") : path.startsWith(href));
  return (
    <aside aria-label="Sidebar" className="no-print bg-nav text-white lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-60 lg:flex-col">
      <div className="flex items-center gap-2.5 px-4 py-4">
        <span className="grid h-8 w-8 place-items-center rounded-md bg-accent text-sm font-bold" aria-hidden="true">Q</span>
        <div className="leading-tight"><div className="text-sm font-semibold">AtliQ</div><div className="text-xs text-white/60">Contract Risk Analyzer</div></div>
      </div>
      <nav aria-label="Main" className="flex gap-1 overflow-x-auto px-2 pb-2 lg:flex-1 lg:flex-col lg:overflow-visible lg:pb-0">
        {items.map((i) => (
          <Link key={i.href} href={i.href} aria-current={active(i.href) ? "page" : undefined}
            className={`flex items-center gap-2.5 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ${active(i.href) ? "bg-white/15 text-white" : "text-white/75 hover:bg-nav-hover hover:text-white"}`}>
            {ICON[i.icon]}{i.label}
          </Link>
        ))}
      </nav>
      <div className="hidden border-t border-white/10 p-3 lg:block">
        <div className="mb-1.5 text-xs text-white/60">Viewing as</div>
        <RoleSwitch />
        <p className="mt-3 text-[11px] leading-snug text-white/50">Prototype on synthetic data. Not legal advice. Decisions stay in this browser.</p>
      </div>
    </aside>
  );
}
