import Link from "next/link";
import type { Metadata } from "next";
import { briefsFor, deadlineIso } from "@/lib/data";
import { getUser } from "@/lib/role";
import { SeverityBadge, TYPE_LABEL } from "@/components/Badges";
import FindingStatus from "@/components/FindingStatus";

export const metadata: Metadata = { title: "Findings worklist" };
export const dynamic = "force-dynamic";

const fmt = (iso: string | null) => (iso ? new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }) : "No date");

export default async function FindingsPage({ searchParams }: { searchParams: Promise<{ level?: string }> }) {
  const user = (await getUser())!;
  if (user.role !== "reviewer") {
    return <div className="card rounded-lg border border-rule bg-card p-6"><h1 className="text-2xl font-bold">Findings worklist</h1><p className="mt-2 text-muted">The worklist is for the reviewer. In your view, open a draft to see its flags and what to ask Karandeep.</p></div>;
  }
  const { level: lv } = await searchParams;
  const level: "High" | "Medium" = lv === "Medium" ? "Medium" : "High";
  const rows = briefsFor(user)
    .map((b) => ({ b, d: deadlineIso(b.slug) }))
    .sort((x, y) => (x.d ?? "9999").localeCompare(y.d ?? "9999") || x.b.counterparty.localeCompare(y.b.counterparty))
    .flatMap(({ b, d }) => b.findings.filter((f) => f.severity === level).map((f) => ({ b, d, f })));
  const count = (l: string) => briefsFor(user).reduce((n, b) => n + b.findings.filter((f) => f.severity === l).length, 0);
  const drafts = new Set(rows.map((r) => r.b.slug)).size;
  const tabs = [["High", "Decide before signing"], ["Medium", "Negotiate"]] as const;
  return (
    <div>
      <h1 className="text-2xl font-bold">Findings worklist</h1>
      <p className="mt-1 max-w-3xl text-muted">Every finding behind the dashboard numbers, in deadline order. Open one to see the quote, the clause and the rule behind it.</p>
      <nav className="mt-4 flex flex-wrap gap-1.5" aria-label="Choose a level">
        {tabs.map(([v, label]) => (
          <Link key={v} href={`/findings?level=${v}`} aria-current={level === v ? "page" : undefined}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${level === v ? "border-accent bg-accent text-white" : "border-rule bg-card text-ink hover:bg-accent-bg"}`}>{label} · {count(v)}</Link>
        ))}
      </nav>
      <p className="mt-3 text-sm text-muted">{rows.length} findings in {drafts} drafts.</p>
      <ul className="mt-3 grid gap-2">
        {rows.map(({ b, d, f }) => (
          <li key={b.slug + f.id} className={`card rounded-lg border border-rule border-l-4 bg-card p-3 ${level === "High" ? "border-l-high" : "border-l-medium"}`}>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <SeverityBadge s={level} />
              <span className="font-semibold text-ink">{b.counterparty}</span>
              <span className="text-muted">{b.doc_type} · due {fmt(d)}</span>
            </div>
            <Link href={`/brief/${b.slug}#${f.id}`} className="mt-1.5 block font-medium text-accent underline">{f.title}</Link>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
              <span>{TYPE_LABEL[f.type] ?? f.type}</span><span>{f.clause_ref}</span>
              <FindingStatus slug={b.slug} id={f.id} needed={level === "High"} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
