import Link from "next/link";
import { briefsFor, highestSeverity, countBy, deadlineIso } from "@/lib/data";
import { getUser } from "@/lib/role";
import { SeverityBadge } from "@/components/Badges";
import DecisionProgress from "@/components/DecisionProgress";
import { ExportLink } from "@/components/Small";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contract dashboard" };

export const dynamic = "force-dynamic";

function fmt(iso: string | null) {
  if (!iso) return "No date in the notes";
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

const BAR: Record<string, string> = { High: "bg-high", Medium: "bg-medium", Low: "bg-low", None: "bg-ok" };
const FILTERS = ["All", "High", "Medium", "Low"] as const;

export default async function QueuePage({ searchParams }: { searchParams: Promise<{ sev?: string }> }) {
  const user = (await getUser())!;
  const role = user.role;
  const reviewer = role === "reviewer";
  const { sev: sevParam } = await searchParams;
  const sev = FILTERS.find((f) => f === sevParam) ?? "All";

  const all = briefsFor(user);
  const totals = all.reduce((t, b) => { const c = countBy(b); return { high: t.high + c.high, medium: t.medium + c.medium, low: t.low + c.low }; }, { high: 0, medium: 0, low: 0 });
  const sumAll = Math.max(1, totals.high + totals.medium + totals.low);
  const clean = all.filter((b) => ["Low", "None"].includes(highestSeverity(b))).length;
  const byLevel = (l: string) => all.filter((b) => highestSeverity(b) === l).length;
  const withMedium = all.filter((b) => countBy(b).medium > 0).length;
  const briefs = sev === "All" ? all : all.filter((b) => (sev === "Low" ? ["Low", "None"].includes(highestSeverity(b)) : highestSeverity(b) === sev));
  const deadlineGroups = [...new Set(all.map((b) => deadlineIso(b.slug) ?? "none"))].map((k) => ({
    key: k, label: k === "none" ? "No date" : fmt(k).replace(/ 2026$/, ""), items: all.filter((b) => (deadlineIso(b.slug) ?? "none") === k),
  }));
  const urgent = all.filter((b) => highestSeverity(b) === "High").slice(0, 3);

  const tiles: { k: string; v: string; sub: string; tone: string; href?: string }[] = [
    { k: "Drafts to review", v: String(all.length), sub: reviewer ? "from the capstone dataset" : "that you requested", tone: "border-t-accent", href: "/#drafts" },
    { k: "Decide before signing", v: reviewer ? String(totals.high) : "Ask Karandeep", sub: reviewer ? `findings, in ${byLevel("High")} of ${all.length} drafts` : "hidden in seller view", tone: "border-t-high", href: reviewer ? "/findings?level=High" : undefined },
    { k: "Negotiate", v: reviewer ? String(totals.medium) : "Ask Karandeep", sub: reviewer ? `findings, in ${withMedium} of ${all.length} drafts` : "hidden in seller view", tone: "border-t-medium", href: reviewer ? "/findings?level=Medium" : undefined },
    { k: "Drafts needing a decision", v: reviewer ? `${byLevel("High")} of ${all.length}` : "Ask Karandeep", sub: reviewer ? `${byLevel("Medium")} negotiate only · ${clean} information only` : "hidden in seller view", tone: "border-t-ok", href: reviewer ? "/?sev=High#drafts" : undefined },
    { k: "Signed contracts read", v: "17 of ~30", sub: "register coverage", tone: "border-t-low", href: reviewer ? "/register" : undefined },
  ];

  return (
    <div>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Contract dashboard</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Start with “Do these first”, then work through all drafts. Every finding quotes the contract and the rule behind it, and ends in a recorded decision.
            {!reviewer && ` You are signed in as ${user.name}: you see the ${all.length === 1 ? "draft" : all.length + " drafts"} you requested, with flag types, missing documents and what to ask Karandeep.`}
          </p>
        </div>
        {reviewer && <ExportLink href="/api/register/export">Export restrictive terms (CSV)</ExportLink>}
      </header>

      <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {tiles.map((t) => (
          <div key={t.k} className={`card relative rounded-lg border border-rule border-t-4 bg-card p-3 ${t.tone} ${t.href ? "hover:bg-accent-bg" : ""}`}>
            <dt className="text-xs uppercase tracking-wide text-muted">{t.href ? <Link href={t.href} className="after:absolute after:inset-0 after:content-[''] focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-accent">{t.k}</Link> : t.k}</dt>
            <dd className="mt-1 text-2xl font-bold leading-tight">{t.v}</dd>
            <dd className="mt-0.5 text-xs text-muted">{t.sub}</dd>
            {t.href && <dd className="mt-1 text-xs font-semibold text-accent" aria-hidden="true">View →</dd>}
          </div>
        ))}
      </dl>

      <section className="mt-6" aria-label="Do these first">
        <h2 className="text-base font-semibold">Do these first</h2>
        <p className="text-sm text-muted">The three drafts with the earliest due dates that have something to decide before signing.</p>
        <ul className="mt-3 grid gap-3 md:grid-cols-3">
          {urgent.map((b) => {
            const c = countBy(b);
            return (
              <li key={b.slug} className="card flex flex-col rounded-lg border border-rule border-l-4 border-l-high bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link className="text-base font-semibold text-accent hover:underline" href={`/brief/${b.slug}`}>{b.counterparty}</Link>
                  <SeverityBadge s="High" />
                </div>
                <div className="text-xs text-muted">{b.doc_type.replace(/\s*\(.*$/, "")} · due {fmt(deadlineIso(b.slug))}</div>
                {reviewer ? <p className="mt-2 flex-1 text-sm">{b.headline}</p> : <p className="mt-2 flex-1 text-sm text-muted">A “Decide before signing” flag is raised. Open the brief for the questions to ask Karandeep.</p>}
                <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted">
                  <span>{reviewer ? `${c.high} to decide · ${c.medium} to negotiate` : "Brief ready"}</span>
                  <Link className="rounded border border-rule px-2.5 py-1 text-ink hover:bg-accent-bg" href={`/brief/${b.slug}`}>Open brief</Link>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section id="drafts" className="mt-8 scroll-mt-4" aria-label="All drafts">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">All drafts</h2>
            <p className="text-sm text-muted">Ordered by due date. Open a row to see its brief.</p>
          </div>
          <nav className="flex flex-wrap gap-1.5" aria-label="Filter by highest severity">
            {FILTERS.map((f) => {
              const n = f === "All" ? all.length : f === "Low" ? clean : byLevel(f);
              return (
                <Link key={f} href={f === "All" ? "/" : `/?sev=${f}`} aria-current={sev === f ? "page" : undefined}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${sev === f ? "border-accent bg-accent text-white" : "border-rule bg-card text-ink hover:bg-accent-bg"}`}>
                  {f === "High" ? "Decide before signing" : f === "Medium" ? "Negotiate" : f === "Low" ? "Information only or none" : f} · {n}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-3 hidden overflow-hidden rounded-lg border border-rule bg-card md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper text-xs font-semibold text-muted">
              <tr><th className="p-3">Draft</th><th className="p-3">AtliQ entity</th><th className="p-3">Due (from notes)</th><th className="p-3">What it needs</th><th className="p-3">{reviewer ? "Progress" : "Status"}</th><th className="p-3"><span className="sr-only">Open</span></th></tr>
            </thead>
            <tbody>
              {briefs.map((b) => {
                const c = countBy(b); const h = highestSeverity(b);
                return (
                  <tr key={b.slug} className="border-t border-rule align-top hover:bg-accent-bg/40">
                    <td className={`border-l-4 p-3 ${h === "High" ? "border-l-high" : h === "Medium" ? "border-l-medium" : "border-l-ok"}`}>
                      <Link className="font-semibold text-accent hover:underline" href={`/brief/${b.slug}`}>{b.counterparty}</Link>
                      <div className="text-xs text-muted">{b.doc_type.replace(/\s*\(.*$/, "")} · {b.tracker_id}{reviewer && b.value ? ` · ${b.value.replace(/\s*\(.*$/, "")}` : ""}</div>
                      {reviewer && <div className="mt-1 line-clamp-2 max-w-md text-xs text-ink/80" title={b.headline}>{b.headline}</div>}
                    </td>
                    <td className="p-3">{b.atliq_entity_in_draft.replace("AtliQ Technologies Private Limited (Pvt Ltd)", "AtliQ Technologies Pvt Ltd")}</td>
                    <td className="p-3 whitespace-nowrap">{fmt(deadlineIso(b.slug))}</td>
                    <td className="p-3">
                      <SeverityBadge s={h} />
                      {reviewer && <div className="mt-1 text-xs text-muted">{c.high} to decide · {c.medium} to negotiate · {c.low} for information</div>}
                    </td>
                    <td className="p-3">{reviewer ? <DecisionProgress slug={b.slug} ids={b.findings.filter((f) => f.severity === "High").map((f) => f.id)} /> : <span className="text-xs text-muted">Brief ready</span>}</td>
                    <td className="p-3 text-right"><Link className="rounded border border-rule px-2.5 py-1 hover:bg-accent-bg" href={`/brief/${b.slug}`}>Open</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <ul className="mt-3 grid gap-3 md:hidden">
          {briefs.map((b) => {
            const c = countBy(b); const h = highestSeverity(b);
            return (
              <li key={b.slug} className={`card rounded-lg border border-rule border-l-4 bg-card p-3 ${h === "High" ? "border-l-high" : h === "Medium" ? "border-l-medium" : "border-l-ok"}`}>
                <Link className="font-semibold text-accent hover:underline" href={`/brief/${b.slug}`}>{b.counterparty}</Link>
                <div className="text-xs text-muted">{b.doc_type.replace(/\s*\(.*$/, "")} · {b.tracker_id}</div>
                {reviewer && <div className="mt-1 text-xs">{b.headline}</div>}
                <div className="mt-2 flex flex-wrap items-center gap-2"><SeverityBadge s={h} />{reviewer && <span className="text-xs text-muted">{c.high} to decide · {c.medium} to negotiate</span>}</div>
                <div className="mt-1 text-xs text-muted">Deadline: {fmt(deadlineIso(b.slug))}</div>
                {reviewer && <div className="mt-1"><DecisionProgress slug={b.slug} ids={b.findings.filter((f) => f.severity === "High").map((f) => f.id)} /></div>}
              </li>
            );
          })}
        </ul>
        {briefs.length === 0 && <p className="mt-3 text-sm text-muted">No drafts at this level.</p>}
        <p className="mt-4 text-xs text-muted">Due dates come from the tracker notes and the 22 Sep, 25 Sep and 27 Sep meeting notes; where the notes give none, the row says so. The dataset date is 28 Sep 2026.</p>
      </section>

      <details className="card mt-8 rounded-lg border border-rule bg-card p-4">
        <summary className="text-base font-semibold">Timeline and totals <span className="text-sm font-normal text-muted">(findings by action, due dates)</span></summary>
        <div className="mt-3 grid gap-4">
      {reviewer && (
        <section className="rounded-lg border border-rule p-4" aria-label="Findings by action">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-base font-semibold">Findings by action</h2>
            <span className="text-xs text-muted">{totals.high + totals.medium + totals.low} findings across {all.length} drafts</span>
          </div>
          <div className="mt-3 flex h-4 overflow-hidden rounded-full bg-low-bg" role="img" aria-label={`${totals.high} decide before signing, ${totals.medium} negotiate, ${totals.low} for your information`}>
            <div className="bg-high" style={{ width: `${(totals.high / sumAll) * 100}%` }} />
            <div className="bg-medium" style={{ width: `${(totals.medium / sumAll) * 100}%` }} />
            <div className="bg-low" style={{ width: `${(totals.low / sumAll) * 100}%` }} />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
            <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-high" />Decide before signing: {totals.high}</span>
            <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-medium" />Negotiate: {totals.medium}</span>
            <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-low" />For your information: {totals.low}</span>
          </div>
        </section>
      )}


      <section className="rounded-lg border border-rule p-4" aria-label="Deadlines">
        <h2 className="text-base font-semibold">Deadlines</h2>
        <p className="text-xs text-muted">Due dates from the tracker and meeting notes. The dataset date is 28 Sep 2026, so earlier dates are not shown as overdue.</p>
        <ol className="mt-3 grid gap-2">
          {deadlineGroups.map((g) => (
            <li key={g.key} className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-start gap-x-3 border-t border-rule pt-2 first:border-0 first:pt-0">
              <span className="text-sm font-semibold">{g.label}</span>
              <span className="flex flex-wrap gap-1.5">
                {g.items.map((b) => (
                  <Link key={b.slug} href={`/brief/${b.slug}`} className="inline-flex items-center gap-1.5 rounded-full border border-rule px-2.5 py-0.5 text-xs hover:bg-accent-bg">
                    <i className={`h-2 w-2 rounded-full ${BAR[highestSeverity(b)] ?? "bg-low"}`} />{b.counterparty.replace(/,? (Inc\.?|LLC|LLP|GmbH|Pvt Ltd|Private Limited|FZ-LLC).*$/i, "")}{g.items.filter((x) => x.counterparty === b.counterparty).length > 1 && <span className="text-muted"> ({/Associate/.test(b.doc_type) ? "BAA" : /Master/.test(b.doc_type) ? "MSA" : "other"})</span>}
                  </Link>
                ))}
              </span>
            </li>
          ))}
        </ol>
      </section>

        </div>
      </details>

    </div>
  );
}
