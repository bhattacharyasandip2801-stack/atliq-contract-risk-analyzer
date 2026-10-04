import type { Brief, Finding } from "@/lib/types";
import { Chip, SeverityBadge, TYPE_LABEL, EXC_LABEL, EXC_TONE, BUNDLE_LABEL } from "./Badges";
import DecisionPanel from "./DecisionPanel";

const srcName = (f: string) => f.split("/").pop()!.replace(/\.md$/, "");

function Quote({ file, quote, label, signed }: { file: string; quote: string; label: string; signed?: boolean }) {
  return (
    <figure className="min-w-0">
      <figcaption className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">{label}</figcaption>
      <blockquote className={`quote ${signed ? "quote-signed" : ""}`}>“{quote}”</blockquote>
      <div className="mt-1 break-words text-xs text-muted">Source: {srcName(file)} <span className="text-ok">· matches the file</span></div>
    </figure>
  );
}

function FindingCard({ slug, f }: { slug: string; f: Finding }) {
  return (
    <article id={f.id} className={`card rounded-lg border border-rule border-l-4 bg-card p-4 ${f.severity === "High" ? "border-l-high" : "border-l-medium"}`}>
      <header className="flex flex-wrap items-center gap-2">
        <SeverityBadge s={f.severity} />
        <Chip tone="accent">{TYPE_LABEL[f.type] ?? f.type}</Chip>
        <Chip>{f.rule}</Chip>
        <span className="text-xs text-muted">{f.clause_ref}</span>
      </header>
      <h3 className="mt-2 text-lg font-semibold leading-snug">{f.title}</h3>
      <p className="mt-2 text-[0.95rem] leading-relaxed">{f.explanation}</p>
      <div className={`mt-3 grid gap-4 ${f.register_refs && f.register_refs.length ? "md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" : ""}`}>
        <Quote file={f.file} quote={f.quote} label={`In this draft, ${f.clause_ref}`} />
        {f.register_refs && f.register_refs.length > 0 && (
          <div className="grid min-w-0 gap-3">
            {f.register_refs.slice(0, 3).map((r, i) => <Quote key={r.entry_id + i} file={r.file} quote={r.quote} label={`Already signed, ${r.clause_ref}`} signed />)}
            {f.register_refs.length > 3 && (
              <details className="text-sm"><summary className="text-accent underline">{f.register_refs.length - 3} more register quotes</summary>
                <div className="mt-2 grid gap-3">{f.register_refs.slice(3).map((r, i) => <Quote key={r.entry_id + "m" + i} file={r.file} quote={r.quote} label={`Already signed, ${r.clause_ref}`} signed />)}</div>
              </details>
            )}
          </div>
        )}
      </div>
      {f.extra_quotes && f.extra_quotes.length > 0 && (
        <details className="mt-3 text-sm"><summary className="text-accent underline">Supporting quotes ({f.extra_quotes.length})</summary>
          <div className="mt-2 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">{f.extra_quotes.map((q, i) => <Quote key={i} file={q.file} quote={q.quote} label={q.clause_ref ?? "Supporting"} />)}</div>
        </details>
      )}
      {f.exception_history && f.exception_history.length > 0 && (
        <div className="mt-3 rounded bg-paper p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">Earlier, similar clauses</div>
          <ul className="mt-1 grid gap-1.5">
            {f.exception_history.map((e, i) => (
              <li key={i} className="text-sm"><Chip tone={EXC_TONE[e.label]}>{EXC_LABEL[e.label]}</Chip> <span className="font-medium">{e.contract}.</span> <span className="text-muted">{e.note}</span></li>
            ))}
          </ul>
        </div>
      )}
      <DecisionPanel slug={slug} findingId={f.id} title={f.title} required={f.severity === "High"} />
    </article>
  );
}

export default function BriefReviewer({ brief, quotesChecked, dropped }: { brief: Brief; quotesChecked: number; dropped: { id: string; reason: string }[] }) {
  const highs = brief.findings.filter((f) => f.severity === "High");
  const meds = brief.findings.filter((f) => f.severity === "Medium");
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <section className="card rounded-lg border border-rule bg-card p-5">
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge s={brief.highest_severity} />
          <Chip>{brief.tracker_id}</Chip><Chip tone="accent">{brief.atliq_entity_in_draft}</Chip><Chip>{brief.client_country}</Chip>
        </div>
        <h1 className="mt-2 text-2xl font-bold leading-tight">{brief.counterparty}</h1>
        <p className="text-muted">{brief.doc_type}</p>
        <p className="mt-3 max-w-3xl text-base leading-relaxed">{brief.headline}</p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <div><dt className="text-xs uppercase tracking-wide text-muted">Deadline</dt><dd>{brief.deadline ?? "None in the notes"}</dd></div>
          <div><dt className="text-xs uppercase tracking-wide text-muted">Value</dt><dd>{brief.value}</dd></div>
          <div><dt className="text-xs uppercase tracking-wide text-muted">Tracker status</dt><dd>{brief.tracker_status || "Not stated"}</dd></div>
        </dl>
        <p className="mt-4 rounded bg-ok-bg px-3 py-2 text-sm text-ok" role="status">
          {quotesChecked} quotes in this brief were checked against the source files just now: {quotesChecked} match.
          {dropped.length > 0 ? ` ${dropped.length} finding(s) withheld because a quote did not match.` : " No finding was withheld."}
        </p>
      </section>

      {brief.exposure.length > 0 && (
        <section className="card rounded-lg border border-rule bg-card p-5">
          <h2 className="text-lg font-semibold">Exposure</h2>
          <p className="text-sm text-muted">Calculated from the numbers in each clause. No cap is shown unless the clause states one.</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-muted"><tr><th className="py-2 pr-3">Item</th><th className="py-2 pr-3">Clause</th><th className="py-2 pr-3">Calculation</th><th className="py-2 pr-3">Result</th><th className="py-2">Cap</th></tr></thead>
              <tbody>{brief.exposure.map((e, i) => (
                <tr key={i} className="border-t border-rule align-top"><td className="py-2 pr-3 font-medium">{e.label}</td><td className="py-2 pr-3">{e.clause_ref}</td><td className="py-2 pr-3">{e.calculation}</td><td className="py-2 pr-3 font-semibold">{e.result}</td><td className="py-2">{e.cap}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </section>
      )}

      {highs.length > 0 && (
        <section aria-labelledby="high"><h2 id="high" className="mb-3 text-lg font-semibold">High severity <span className="text-base font-normal text-muted">({highs.length}): each needs a recorded decision</span></h2>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4">{highs.map((f) => <FindingCard key={f.id} slug={brief.slug} f={f} />)}</div></section>
      )}
      {meds.length > 0 && (
        <section aria-labelledby="med"><h2 id="med" className="mb-3 text-lg font-semibold">Medium severity <span className="text-base font-normal text-muted">({meds.length})</span></h2>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4">{meds.map((f) => <FindingCard key={f.id} slug={brief.slug} f={f} />)}</div></section>
      )}
      {brief.findings.length === 0 && (
        <section className="card rounded-lg border border-ok/30 bg-ok-bg p-5"><h2 className="text-lg font-semibold text-ok">No High or Medium findings</h2><p className="mt-1 text-sm">The checks below were run and passed. Minor points are listed under “Worth knowing”.</p></section>
      )}

      <section id="docs" className="card rounded-lg border border-rule bg-card p-5">
        <h2 className="text-lg font-semibold">Documents this deal needs</h2>
        {brief.bundle.needed.length === 0 ? <p className="mt-2 text-sm text-muted">No other document is referred to in this draft.</p> : (
          <ul className="mt-3 grid gap-3">
            {brief.bundle.needed.map((d, i) => (
              <li key={i} className="grid gap-1 border-t border-rule pt-3 first:border-0 first:pt-0">
                <div className="flex flex-wrap items-center gap-2"><Chip tone={BUNDLE_LABEL[d.status].tone}>{BUNDLE_LABEL[d.status].t}</Chip><span className="font-medium">{d.document}</span></div>
                <p className="text-sm text-muted">{d.note}</p>
                <blockquote className="quote text-sm">“{d.quote}”<span className="block text-xs text-muted not-italic">Source: {srcName(d.file)}</span></blockquote>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="data" className="card rounded-lg border border-rule bg-card p-5">
        <h2 className="text-lg font-semibold">Data type</h2>
        <p className="mt-1"><Chip tone={brief.data_class.question ? "warn" : "accent"}>{brief.data_class.class}</Chip></p>
        <p className="mt-2 text-sm leading-relaxed">{brief.data_class.basis}</p>
        {brief.data_class.question && <p className="mt-3 rounded border border-medium/30 bg-medium-bg p-3 text-sm"><span className="font-semibold">Question for a person: </span>{brief.data_class.question}</p>}
        <blockquote className="quote mt-3 text-sm">“{brief.data_class.quote}”<span className="block text-xs text-muted not-italic">Source: {srcName(brief.data_class.file)}</span></blockquote>
      </section>

      <section className="card rounded-lg border border-medium/40 bg-card p-5" aria-labelledby="nc">
        <h2 id="nc" className="text-lg font-semibold">NOT CHECKED</h2>
        <p className="text-sm text-muted">Things the tool could not test. These are never counted as a pass.</p>
        {brief.not_checked.length === 0 ? <p className="mt-2 text-sm">Nothing was left untested.</p> : (
          <ul className="mt-3 grid gap-2">{brief.not_checked.map((n, i) => <li key={i} className="text-sm"><span className="font-medium">{n.item}.</span> <span className="text-muted">{n.reason}</span></li>)}</ul>
        )}
      </section>

      {brief.low.length > 0 && (
        <details className="card rounded-lg border border-rule bg-card p-5"><summary className="text-lg font-semibold">Worth knowing ({brief.low.length})</summary>
          <ul className="mt-3 grid gap-4">{brief.low.map((l, i) => (
            <li key={i}><div className="flex flex-wrap items-center gap-2"><SeverityBadge s="Low" /><span className="font-medium">{l.title}</span><span className="text-xs text-muted">{l.clause_ref}</span></div>
              <p className="mt-1 text-sm text-muted">{l.note}</p><blockquote className="quote mt-1 text-sm">“{l.quote}”<span className="block text-xs text-muted not-italic">Source: {srcName(l.file)}</span></blockquote></li>
          ))}</ul>
        </details>
      )}

      {brief.checks_passed.length > 0 && (
        <details className="card rounded-lg border border-rule bg-card p-5"><summary className="text-lg font-semibold">Checks that passed ({brief.checks_passed.length})</summary>
          <ul className="mt-3 grid gap-4">{brief.checks_passed.map((c, i) => (
            <li key={i}><div className="flex flex-wrap items-center gap-2"><Chip tone="ok">Passed</Chip><Chip>{c.rule}</Chip></div><p className="mt-1 text-sm">{c.note}</p>
              <blockquote className="quote mt-1 text-sm">“{c.quote}”<span className="block text-xs text-muted not-italic">Source: {srcName(c.file)}</span></blockquote></li>
          ))}</ul>
        </details>
      )}
      <p className="text-xs text-muted">{brief.provenance} This brief reads clause text. It is not a legal opinion; for a legal conclusion, ask counsel.</p>
    </div>
  );
}
