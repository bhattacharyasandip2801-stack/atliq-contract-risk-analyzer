"use client";
import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole } from "./RoleProvider";
import { SignedInCard } from "./SignedIn";
import { DemoStartButton } from "./UserDemo";

const I = (d: string) => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);
const ICON = {
  queue: I("M4 6h16M4 12h16M4 18h10"),
  register: I("M5 4h10l4 4v12H5zM14 4v5h5M8 13h8M8 17h8"),
  decisions: I("M5 12l4 4 10-10"),
  about: I("M12 3a9 9 0 100 18 9 9 0 000-18zM12 8h.01M11 12h1v5h1"),
  eval: I("M5 20V10M12 20V4M19 20v-7"),
  audit: I("M12 8v5l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z"),
  intake: I("M12 5v14M5 12h14"),
  kb: I("M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-5-5"),
};
const ITEMS: { href: string; label: string; icon: keyof typeof ICON; reviewerOnly?: boolean; group: string }[] = [
  { href: "/about", group: "", label: "About this product", icon: "about" },
  { href: "/", group: "Work", label: "Contract Dashboard", icon: "queue" },
  { href: "/intake", group: "Work", label: "Review a new contract", icon: "intake" },
  { href: "/findings", group: "Work", label: "Findings worklist", icon: "decisions", reviewerOnly: true },
  { href: "/knowledge", group: "Reference", label: "Knowledge base", icon: "kb", reviewerOnly: true },
  { href: "/register", group: "Reference", label: "Obligation register", icon: "register", reviewerOnly: true },
  { href: "/decisions", group: "Work", label: "Decisions", icon: "decisions", reviewerOnly: true },
  { href: "/evaluation", group: "Quality and Audit", label: "Evaluation", icon: "eval", reviewerOnly: true },
  { href: "/audit", group: "Quality and Audit", label: "Audit log", icon: "audit" },
];
const GROUPS = ["", "Work", "Reference", "Quality and Audit"];

export default function Sidebar() {
  const path = usePathname();
  const role = useRole();
  const active = (href: string) => (href === "/" ? path === "/" || path.startsWith("/brief") : path.startsWith(href));
  const items = ITEMS.filter((i) => !i.reviewerOnly || role === "reviewer").sort((a, b) => GROUPS.indexOf(a.group) - GROUPS.indexOf(b.group));
  const link = (i: (typeof ITEMS)[number]) => (
    <Link key={i.href} href={i.href} aria-current={active(i.href) ? "page" : undefined}
      className={`flex items-center gap-2.5 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ${active(i.href) ? "bg-accent text-white" : "text-white/75 hover:bg-nav-hover hover:text-white"}`}>
      {ICON[i.icon]}{i.label}
    </Link>
  );
  return (
    <aside aria-label="Sidebar" className="no-print bg-nav text-white lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-60 lg:flex-col">
      <div className="flex items-center gap-2.5 px-4 py-4">
        <span className="grid h-8 w-8 place-items-center rounded-md bg-accent text-sm font-bold" aria-hidden="true">Q</span>
        <div className="leading-tight"><div className="text-sm font-semibold">AtliQ</div><div className="text-xs text-white/60">Contract Risk Analyzer</div></div>
      </div>
      <nav aria-label="Main" className="flex gap-1 overflow-x-auto px-2 pb-2 lg:flex-1 lg:flex-col lg:overflow-visible lg:pb-0">
        {items.map((i, n) => (
          <Fragment key={i.href}>
            {i.group !== "" && (n === 0 || items[n - 1].group !== i.group) && <span className="hidden px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-white/60 first:pt-1 lg:block">{i.group}</span>}
            {link(i)}
          </Fragment>
        ))}
      </nav>
      <div className="hidden border-t border-white/10 p-3 lg:block">
        <div className="mb-3"><DemoStartButton /></div>
        <SignedInCard />
        <p className="mt-3 text-[11px] leading-snug text-white/50">Prototype on synthetic data. Not legal advice. Decisions stay in this browser.</p>
      </div>
    </aside>
  );
}
