import Link from "next/link";
import { briefsFor, highestSeverity, countBy, deadlineIso } from "@/lib/data";
import { getUser } from "@/lib/role";
import { SeverityBadge } from "@/components/Badges";
import DecisionProgress from "@/components/DecisionProgress";
import { ExportLink } from "@/components/Small";
import Gloss from "@/components/Gloss";
import { shortHeadline } from "@/lib/short";
import type { Metadata } from "next";
import Home from "@/components/Home";

export async function generateMetadata(): Promise<Metadata> {
  return (await getUser()) ? { title: "Contract Dashboard" } : { title: { absolute: "AtliQ Contract Risk Analyzer: know what you are signing" } };
}

export const dynamic = "force-dynamic";

function fmt(iso: string | null) {
  if (!iso) return "No date in the notes";
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/** Today in India, or DEMO_AS_OF=YYYY-MM-DD to pin the date for a demo. */
const AS_OF = () => process.env.DEMO_AS_OF || new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
function dueNote(iso: string | null): { text: string; cls: string } | null {
  if (!iso) return null;
  const d = Math.round((Date.parse(iso + "T00:00:00Z") - Date.parse(AS_OF() + "T00:00:00Z")) / 86400000);
  if (d < 0) return { text: `Overdue by ${-d} day${d === -1 ? "" : "s"}`, cls: "font-semibold text-high" };
  if (d === 0) return { text: "Due today", cls: "font-semibold text-medium" };
  if (d <= 7) return { text: `Due in ${d} day${d === 1 ? "" : "s"}`, cls: "text-medium" };
  return null;
}
const Due = ({ iso }: { iso: string | null }) => { const n = dueNote(iso); return n ? <span className={`block text-xs ${n.cls}`}>{n.text}</span> : null; };

const BAR: Record<string, string> = { High: "bg-high", Medium: "bg-medium", Low: "bg-low", None: "bg-ok" };
const FILTERS = ["All", "High", "Medium", "Low"] as const;

const PAGE_SIZE = 10;
const SORTS = [["due", "Due date, soonest first"], ["name", "Counterparty, A to Z"], ["needs", "Most to decide first"]] as const;
const RANK: Record<string, number> = { High: 0, Medium: 1, Low: 2, None: 3 };
const entityName = (e: string) => e.replace("AtliQ Technologies Private Limited (Pvt Ltd)", "AtliQ Technologies Pvt Ltd");

export default async function QueuePage({ searchParams }: { searchParams: Promise<{ sev?: string; q?: string; entity?: string; sort?: string; page?: string }> }) {
  const user = await getUser();
  if (!user) return <Home signedIn={false} />;
  const role = user.role;
  const reviewer = role === "reviewer";
  const sp = await searchParams;
  const sev = FILTERS.find((f) => f === sp.sev) ?? "All";
  const q = (sp.q ?? "").trim().slice(0, 80);
  const sort = SORTS.find(([k]) => k === sp.sort)?.[0] ?? "due";

  const all = briefsFor(user);
  const totals = all.reduce((t, b) => { const c = countBy(b); return { high: t.high + c.high, medium: t.medium + c.medium, low: t.low + c.low }; }, { high: 0, medium: 0, low: 0 });
  const clean = all.filter((b) => ["Low", "None"].includes(highestSeverity(b))).length;
  const byLevel = (l: string) => all.filter((b) => highestSeverity(b) === l).length;
  const withMedium = all.filter((b) => countBy(b).medium > 0).length;
  const entities = [...new Set(all.map((b) => entityName(b.atliq_entity_in_draft)))].sort();
  const entity = entities.find((e) => e === sp.entity) ?? "";
  const bySev = sev === "All" ? all : all.filter((b) => (sev === "Low" ? ["Low", "None"].includes(highestSeverity(b)) : highestSeverity(b) === sev));
  const filtered = bySev
    .filter((b) => !entity || entityName(b.atliq_entity_in_draft) === entity)
    .filter((b) => !q || `${b.counterparty} ${b.doc_type} ${b.tracker_id}`.toLowerCase().includes(q.toLowerCase()));
  const due = (b: (typeof all)[number]) => deadlineIso(b.slug) ?? "9999-12-31";
  const sorted = [...filtered].sort((a, b) =>
    sort === "name" ? a.counterparty.localeCompare(b.counterparty)
    : sort === "needs" ? (RANK[highestSeverity(a)] - RANK[highestSeverity(b)]) || due(a).localeCompare(due(b)) || a.counterparty.localeCompare(b.counterparty)
    : due(a).localeCompare(due(b)) || a.counterparty.localeCompare(b.counterparty));
  const pages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, parseInt(sp.page ?? "1", 10) || 1));
  const briefs = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const href = (over: Record<string, string | undefined>) => {
    const m: Record<string, string | undefined> = { sev: sev === "All" ? undefined : sev, q: q || undefined, entity: entity || undefined, sort: sort === "due" ? undefined : sort, page: undefined, ...over };
    const qs = Object.entries(m).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`).join("&");
    return (qs ? `/?${qs}` : "/") + "#drafts";
  };
  const filtersOn = sev !== "All" || !!q || !!entity;
  const deadlineGroups = [...new Set(all.map((b) => deadlineIso(b.slug) ?? "none"))].map((k) => ({
    key: k, label: k === "none" ? "No date" : fmt(k).replace(/ 2026$/, ""), items: all.filter((b) => (deadlineIso(b.slug) ?? "none") === k),
  }));
  const urgent = all.filter((b) => highestSeverity(b) === "High").slice(0, 3);

  const tiles: { k: string; v: string; sub: string; tone: string; href?: string; cta?: string }[] = [
    { k: "Drafts to review", v: String(all.length), sub: reviewer ? "waiting for your review" : "that you requested", tone: "border-t-accent", href: "/#drafts", cta: "See the list" },
    { k: "Decide before signing", v: reviewer ? String(totals.high) : "Ask Karandeep", sub: reviewer ? `findings, in ${byLevel("High")} of ${all.length} drafts` : "hidden in seller view", tone: "border-t-high", href: reviewer ? "/findings?level=High" : undefined, cta: "See every finding" },
    { k: "Negotiate", v: reviewer ? String(totals.medium) : "Ask Karandeep", sub: reviewer ? `findings, in ${withMedium} of ${all.length} drafts` : "hidden in seller view", tone: "border-t-medium", href: reviewer ? "/findings?level=Medium" : undefined, cta: "See every finding" },
    { k: "Drafts needing a decision", v: reviewer ? `${byLevel("High")} of ${all.length}` : "Ask Karandeep", sub: reviewer ? `${byLevel("Medium")} negotiate only · ${clean} information only` : "hidden in seller view", tone: "border-t-ok", href: reviewer ? "/?sev=High#drafts" : undefined, cta: "See those drafts" },
    { k: "Signed contracts read", v: "17 of ~30", sub: "signed contracts read so far", tone: "border-t-low", href: reviewer ? "/register" : undefined, cta: "See what they say" },
  ];

  return (
    <div>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Contract Dashboard</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Start with “Top priorities”, then work through all drafts. Every finding quotes the contract and the rule behind it, and ends in a recorded decision.
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
            {t.href && <dd className="mt-1 text-xs font-semibold text-accent" aria-hidden="true">{t.cta ?? "View"} →</dd>}
          </div>
        ))}
      </dl>

      <section className="mt-10" aria-label="Top priorities">
        <h2 className="border-b-2 border-high/40 pb-1.5 text-lg font-bold">Top priorities</h2>
        <p className="mt-1.5 text-sm text-muted">Act on these first: the three drafts due soonest that need a decision before signing.</p>
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
                <Due iso={deadlineIso(b.slug)} />
                {reviewer ? <p className="mt-2 flex-1 text-sm"><Gloss text={shortHeadline(b.slug, b.headline)} /></p> : <p className="mt-2 flex-1 text-sm text-muted">A “Decide before signing” flag is raised. Open the brief for the questions to ask Karandeep.</p>}
                <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted">
                  <span>{reviewer ? `${c.high} to decide · ${c.medium} to negotiate` : "Brief ready"}</span>
                  <Link className="rounded-md bg-accent px-3 py-2 text-xs font-semibold text-white hover:opacity-90" href={`/brief/${b.slug}`}>Open brief →</Link>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-10" aria-label="Due dates">
        <h2 className="border-b-2 border-rule pb-1.5 text-lg font-bold">Due dates</h2>
        <p className="mt-1.5 text-sm text-muted">When each draft is due, soonest first. Select a name to open its brief. Dates before today are marked overdue.</p>
        <ol className="card mt-3 grid gap-2 rounded-lg border border-rule bg-card p-4">
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

      <details id="drafts" open className="queue mt-10 scroll-mt-4">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 border-b-2 border-rule pb-1.5">
          <h2 className="text-lg font-bold">Full queue ({all.length} drafts)</h2>
          <span className="queue-hint text-xs font-medium text-muted" aria-hidden="true" />
        </summary>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted">{sorted.length === all.length ? `${all.length} drafts` : `${sorted.length} of ${all.length} drafts`}, sorted by {SORTS.find(([k]) => k === sort)![1].toLowerCase()}. Open a row to see its brief.</p>
          </div>
          <nav className="flex flex-wrap gap-1.5" aria-label="Filter by highest severity">
            {FILTERS.map((f) => {
              const n = f === "All" ? all.length : f === "Low" ? clean : byLevel(f);
              return (
                <Link key={f} href={href({ sev: f === "All" ? undefined : f })} aria-current={sev === f ? "page" : undefined}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${sev === f ? "border-accent bg-accent text-white" : "border-rule bg-card text-ink hover:bg-accent-bg"}`}>
                  {f === "High" ? "Decide before signing" : f === "Medium" ? "Negotiate" : f === "Low" ? "Information only or none" : f} · {n}
                </Link>
              );
            })}
          </nav>
        </div>

        <form method="get" action="/" className="mt-3 flex flex-wrap items-end gap-3 rounded-lg border border-rule bg-card p-3" aria-label="Search and sort drafts">
          {sev !== "All" && <input type="hidden" name="sev" value={sev} />}
          <label className="grid gap-1 text-xs font-semibold text-muted">Search
            <input name="q" defaultValue={q} placeholder="Counterparty, type or ID" className="w-56 rounded-md border border-rule bg-paper px-2.5 py-1.5 text-sm font-normal text-ink" />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-muted">AtliQ entity
            <select name="entity" defaultValue={entity} className="rounded-md border border-rule bg-paper px-2.5 py-1.5 text-sm font-normal text-ink">
              <option value="">All entities</option>
              {entities.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-semibold text-muted">Sort by
            <select name="sort" defaultValue={sort} className="rounded-md border border-rule bg-paper px-2.5 py-1.5 text-sm font-normal text-ink">
              {SORTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </label>
          <button type="submit" className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white">Apply</button>
          {filtersOn && <Link href="/#drafts" className="py-1.5 text-sm text-accent hover:underline">Clear filters</Link>}
        </form>

        <div className="mt-3 hidden overflow-hidden rounded-lg border border-rule bg-card md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper text-xs font-semibold text-muted">
              <tr><th className="p-3"><Link href={href({ sort: "name" })} className="hover:underline" aria-label="Sort by counterparty">Counterparty{sort === "name" ? " ↑" : ""}</Link></th><th className="p-3">AtliQ entity</th><th className="p-3"><Link href={href({ sort: undefined })} className="hover:underline" aria-label="Sort by due date">Due{sort === "due" ? " ↑" : ""}</Link></th><th className="p-3"><Link href={href({ sort: "needs" })} className="hover:underline" aria-label="Sort by most to decide">What it needs{sort === "needs" ? " ↑" : ""}</Link></th><th className="p-3">{reviewer ? "Progress" : "Status"}</th><th className="p-3"><span className="sr-only">Open</span></th></tr>
            </thead>
            <tbody>
              {briefs.map((b) => {
                const c = countBy(b); const h = highestSeverity(b);
                return (
                  <tr key={b.slug} className="border-t border-rule align-top hover:bg-accent-bg/40">
                    <td className={`border-l-4 p-3 ${h === "High" ? "border-l-high" : h === "Medium" ? "border-l-medium" : "border-l-ok"}`}>
                      <Link className="font-semibold text-accent hover:underline" href={`/brief/${b.slug}`}>{b.counterparty}</Link>
                      <div className="text-xs text-muted">{b.doc_type.replace(/\s*\(.*$/, "")} · {b.tracker_id}{reviewer && b.value ? ` · ${b.value.replace(/\s*\(.*$/, "")}` : ""}</div>
                      {reviewer && <div className="mt-1 line-clamp-2 max-w-md text-xs text-ink/80" title={b.headline}><Gloss text={shortHeadline(b.slug, b.headline)} /></div>}
                    </td>
                    <td className="p-3">{entityName(b.atliq_entity_in_draft)}</td>
                    <td className="p-3 whitespace-nowrap">{fmt(deadlineIso(b.slug))}<Due iso={deadlineIso(b.slug)} /></td>
                    <td className="p-3">
                      <SeverityBadge s={h} />
                      {reviewer && <div className="mt-1 text-xs text-muted">{c.high} to decide · {c.medium} to negotiate · {c.low} for information</div>}
                    </td>
                    <td className="p-3">{reviewer ? <DecisionProgress slug={b.slug} ids={b.findings.filter((f) => f.severity === "High").map((f) => f.id)} /> : <span className="text-xs text-muted">Brief ready</span>}</td>
                    <td className="p-3 text-right"><Link className="inline-block rounded-md bg-accent px-3 py-2 text-xs font-semibold text-white hover:opacity-90" href={`/brief/${b.slug}`}>Open →</Link></td>
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
                {reviewer && <div className="mt-1 text-xs"><Gloss text={shortHeadline(b.slug, b.headline)} /></div>}
                <div className="mt-2 flex flex-wrap items-center gap-2"><SeverityBadge s={h} />{reviewer && <span className="text-xs text-muted">{c.high} to decide · {c.medium} to negotiate</span>}</div>
                <div className="mt-1 text-xs text-muted">Deadline: {fmt(deadlineIso(b.slug))}</div>
                <Due iso={deadlineIso(b.slug)} />
                {reviewer && <div className="mt-1"><DecisionProgress slug={b.slug} ids={b.findings.filter((f) => f.severity === "High").map((f) => f.id)} /></div>}
              </li>
            );
          })}
        </ul>
        {briefs.length === 0 && <p className="mt-3 text-sm text-muted">No drafts match these filters. <Link href="/#drafts" className="text-accent hover:underline">Clear filters</Link></p>}
        {sorted.length > PAGE_SIZE && (
          <nav className="mt-3 flex items-center justify-between gap-3 text-sm" aria-label="Pages of drafts">
            <span className="text-muted">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}</span>
            <span className="flex items-center gap-2">
              {page > 1 ? <Link href={href({ page: String(page - 1) })} rel="prev" className="rounded-md border border-rule px-3 py-1 hover:bg-accent-bg">Previous</Link> : <span className="rounded-md border border-rule px-3 py-1 text-muted opacity-50" aria-disabled="true">Previous</span>}
              <span className="text-muted">Page {page} of {pages}</span>
              {page < pages ? <Link href={href({ page: String(page + 1) })} rel="next" className="rounded-md border border-rule px-3 py-1 hover:bg-accent-bg">Next</Link> : <span className="rounded-md border border-rule px-3 py-1 text-muted opacity-50" aria-disabled="true">Next</span>}
            </span>
          </nav>
        )}
        <p className="mt-4 text-xs text-muted">Due dates come from the tracker notes and the 22 Sep, 25 Sep and 27 Sep meeting notes; where the notes give none, the row says so. Overdue and due-soon labels count from today.</p>
      </details>

    </div>
  );
}
