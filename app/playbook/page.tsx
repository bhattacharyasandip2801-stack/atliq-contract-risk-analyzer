import type { Metadata } from "next";
import Link from "next/link";
import { getRole } from "@/lib/role";
import { cases, caseLabels, checklistRules, checklistExtra, draftsHitting, entityLines, exceptionsOnRecord, karandeepNote } from "@/lib/playbook";
import { Chip } from "@/components/Badges";
import { AuditOnMount } from "@/components/Small";

export const metadata: Metadata = { title: "Playbook" };
export const dynamic = "force-dynamic";

export default async function PlaybookPage() {
  if ((await getRole()) === "seller") return <p className="card rounded-lg border border-rule bg-card p-6 text-muted">The playbook shows Karandeep&apos;s rules and other clients&apos; negotiations, so it is hidden in the seller view. Ask Karandeep.</p>;
  const rules = checklistRules(), cs = cases(), ex = exceptionsOnRecord(), ent = entityLines();
  return (
    <div>
      <AuditOnMount action="view playbook" target="playbook" />
      <h1 className="text-2xl font-bold">Playbook</h1>
      <p className="mt-2 max-w-3xl text-muted">What Karandeep checks for, how AtliQ has negotiated before, and which past exceptions were deliberate and which were waved through. It used to live in his memory and in a half-page note. Every line below is copied from the dataset files and the tool adds nothing of its own. Search all of it in the <Link className="text-accent underline" href="/knowledge">Knowledge base</Link>.</p>

      <section className="card mt-5 rounded-lg border border-rule bg-card p-5" aria-label="Checklist">
        <h2 className="text-lg font-semibold">1. Karandeep&apos;s checklist</h2>
        <p className="mt-1 text-sm text-muted">The only written record of how AtliQ reviews contracts. Last edited March 2024. The count shows how many of the 15 incoming drafts have a finding that cites this rule (the link between checklist lines and rules is a working draft).</p>
        <ul className="mt-3 grid gap-2">
          {rules.map((r) => { const hits = draftsHitting(r); return (
            <li key={r} className="rounded border border-rule p-3">
              <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-sm font-semibold">{r}</span>{hits.length > 0 && <Chip tone="warn">{hits.length} draft{hits.length === 1 ? "" : "s"} hit</Chip>}</div>
              {hits.length > 0 && <p className="mt-1 text-xs text-muted">{hits.map((h, i) => <span key={h.slug}>{i > 0 && ", "}<Link className="text-accent underline" href={`/brief/${h.slug}`}>{h.counterparty}</Link></span>)}</p>}
            </li>); })}
        </ul>
        <p className="mt-2 text-sm text-muted">{checklistExtra()}</p>
        <h3 className="mt-4 text-sm font-semibold">What the list leaves out, in Karandeep&apos;s own words (September 2026)</h3>
        {karandeepNote().map((p, i) => <blockquote key={i} className="quote mt-2 text-sm">{p}</blockquote>)}
      </section>

      <section className="card mt-5 rounded-lg border border-rule bg-card p-5" aria-label="Exceptions">
        <h2 className="text-lg font-semibold">2. Exceptions on record</h2>
        <p className="mt-1 text-sm text-muted">On paper a deliberate exception and a slip look the same. The register labels each clause from the negotiation notes and the Brightwater post-mortem. A waved-through clause is never a precedent. A deliberate one carries its stated limit, such as Al Noor&apos;s 10% cap: &ldquo;a strategic exception for Al Noor only — not our new standard&rdquo;.</p>
        <div className="mt-3 overflow-x-auto" tabIndex={0} role="region" aria-label="Playbook table"><table className="w-full min-w-[480px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-muted"><tr><th className="py-1 pr-3">Counterparty</th><th className="py-1 pr-3">Deliberate clauses</th><th className="py-1">Waved-through clauses</th></tr></thead>
          <tbody>{ex.map((e) => <tr key={e.contract} className="border-t border-rule"><td className="py-1.5 pr-3"><Link className="text-accent underline" href={`/register?type=all&q=${encodeURIComponent(e.contract.split(" ")[0])}`}>{e.contract}</Link></td><td className="py-1.5 pr-3">{e.deliberate || "–"}</td><td className="py-1.5">{e.waved ? <Chip tone="warn">{e.waved}</Chip> : "–"}</td></tr>)}</tbody>
        </table></div>
      </section>

      <section className="card mt-5 rounded-lg border border-rule bg-card p-5" aria-label="Negotiations">
        <h2 className="text-lg font-semibold">3. Past negotiations ({cs.length})</h2>
        <p className="mt-1 text-sm text-muted">Jay&apos;s partial reconstruction from old inboxes, copied as written. It does not cover Sunrise, DataNest, Orbit, Seaside or the older NDAs, and nobody has reviewed it. The chips show what the register holds for the same counterparty.</p>
        <div className="mt-3 grid gap-2">
          {cs.map((c) => { const l = caseLabels(c); return (
            <details key={c.title} className="rounded border border-rule p-3">
              <summary className="flex flex-wrap items-center gap-2"><span className="font-semibold">{c.title}</span>
                {l ? <>{l.deliberate > 0 && <Chip tone="accent">{l.deliberate} deliberate</Chip>}{l.waved > 0 && <Chip tone="warn">{l.waved} waved through</Chip>}</> : <Chip>Not in the register</Chip>}</summary>
              <ul className="mt-2 grid gap-1 text-sm">{c.lines.map((x, i) => <li key={i} className="quote">{x}</li>)}</ul>
            </details>); })}
        </div>
      </section>

      <section className="card mt-5 rounded-lg border border-rule bg-card p-5" aria-label="Entities">
        <h2 className="text-lg font-semibold">4. Which AtliQ entity signs</h2>
        <p className="mt-1 text-sm text-muted">From the finance fact sheet (last updated January 2026).</p>
        <ul className="mt-2 grid gap-1 text-sm">{ent.map((l, i) => <li key={i} className={/^\d\./.test(l) ? "mt-2 font-semibold" : "quote"}>{l}</li>)}</ul>
      </section>
      <p className="mt-4 text-xs text-muted">The labels and counts are read from the stored register and briefs. They are Karandeep&apos;s and counsel&apos;s to confirm.</p>
    </div>
  );
}
