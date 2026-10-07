"use client";
import { useRef, useState } from "react";
import { useActor, useRole } from "./RoleProvider";
import { logAudit } from "@/lib/store";
import { Chip, SeverityBadge, TYPE_LABEL } from "./Badges";
import Link from "next/link";
import type { IntakeResult } from "@/lib/intake";

interface Stored { slug: string; counterparty: string; doc_type: string; headline: string; high: number; medium: number; low: number; quotes_checked: number; withheld: number; findings: { id: string; severity: string; title: string; clause_ref: string }[] }
type Result = IntakeResult & { stored?: Stored };

const GEOS: [string, string][] = [["", "Not sure / not given"], ["US", "United States"], ["India", "India"], ["Middle East", "Middle East"], ["Europe", "Europe"], ["Other", "Elsewhere outside the US"], ["n/a", "Not a client contract (agency, freelancer, partner)"]];
const show = (s: string) => s.replace(/\*+/g, "");

export default function IntakeForm({ samples }: { samples: { slug: string; label: string }[] }) {
  const actor = useActor(), role = useRole();
  const [text, setText] = useState(""), [geo, setGeo] = useState(""), [value, setValue] = useState(""), [cur, setCur] = useState("$"), [name, setName] = useState("");
  const [res, setRes] = useState<Result | null>(null), [busy, setBusy] = useState(false), [msg, setMsg] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);

  async function loadSample(slug: string) {
    if (!slug) return;
    setMsg(null);
    const r = await fetch(`/api/intake/sample?slug=${encodeURIComponent(slug)}`);
    const j = await r.json();
    if (!r.ok) { setMsg(j.error ?? "Could not load that draft."); return; }
    setText(j.text); setGeo(j.geography); setName(j.counterparty); setRes(null);
  }
  function onFile(f: File | undefined) {
    if (!f) return;
    setRes(null); setMsg(null);
    if (!/\.(txt|md)$/i.test(f.name) && !/^text\//.test(f.type)) { setMsg(`"${f.name}" is not plain text. This prototype reads .txt and .md files, or pasted text. For a PDF, Word file or scan: NOT CHECKED. Copy the text out and paste it.`); return; }
    if (f.size > 1_000_000) { setMsg("That file is over 1 MB. Paste the part you want checked."); return; }
    const rd = new FileReader(); rd.onload = () => { setText(String(rd.result ?? "")); setName(f.name.replace(/\.\w+$/, "")); }; rd.readAsText(f);
  }
  async function check(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null); setRes(null);
    try {
      const v = Number(value.replace(/,/g, ""));
      const r = await fetch("/api/intake", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text, geography: geo, value: v > 0 ? v : null, currency: cur }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Check failed");
      setRes(j);
      logAudit(actor, "check new draft", name || "pasted text", `${j.stop ? "stopped: real data" : `${j.findings.filter((f: { severity: string }) => f.severity === "High").length} high, ${j.findings.filter((f: { severity: string }) => f.severity === "Medium").length} medium`} · ${j.chars} characters, text not stored`);
    } catch (er) { setMsg((er as Error).message); } finally { setBusy(false); }
  }
  const reviewer = role === "reviewer";
  return (
    <div>
      <form onSubmit={check} className="card rounded-lg border border-rule bg-card p-4">
        <div className="flex flex-wrap items-end gap-3">
          {samples.length > 0 && (
            <label className="min-w-0 text-xs text-muted">Try a draft from the dataset
              <select onChange={(e) => loadSample(e.target.value)} defaultValue="" className="mt-1 block max-w-full rounded border border-rule bg-paper p-2 text-sm text-ink">
                <option value="">Choose…</option>{samples.map((s) => <option key={s.slug} value={s.slug}>{s.label}</option>)}
              </select>
            </label>
          )}
          <label className="text-xs text-muted">Or upload a .txt or .md file
            <input ref={file} type="file" accept=".txt,.md,text/plain,text/markdown" onChange={(e) => { onFile(e.target.files?.[0]); if (file.current) file.current.value = ""; }} className="mt-1 block text-sm text-ink" />
          </label>
        </div>
        <label className="mt-3 block text-xs text-muted">Or paste the contract text
          <textarea value={text} onChange={(e) => { setText(e.target.value); setRes(null); }} rows={9} placeholder="Paste the draft here. The text is read once and not stored." className="mt-1 block w-full rounded border border-rule bg-paper p-2.5 font-mono text-xs leading-relaxed text-ink" />
        </label>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="min-w-0 text-xs text-muted">Where is the client?
            <select value={geo} onChange={(e) => setGeo(e.target.value)} className="mt-1 block max-w-full rounded border border-rule bg-paper p-2 text-sm text-ink">{GEOS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          </label>
          <label className="text-xs text-muted">Contract value (optional)
            <span className="mt-1 flex gap-1"><select aria-label="Currency" value={cur} onChange={(e) => setCur(e.target.value)} className="rounded border border-rule bg-paper p-2 text-sm text-ink">{["$", "₹", "€", "£"].map((c) => <option key={c}>{c}</option>)}</select>
              <input inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value)} placeholder="210000" className="w-32 rounded border border-rule bg-paper p-2 text-sm text-ink" /></span>
          </label>
          <button disabled={busy || text.trim().length < 20} className="rounded bg-accent px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">{busy ? "Checking…" : "Check this draft"}</button>
          {text && <button type="button" onClick={() => { setText(""); setRes(null); setName(""); setMsg(null); }} className="rounded border border-rule bg-card px-3 py-2.5 text-sm hover:bg-accent-bg">Clear</button>}
        </div>
      </form>
      {msg && <p role="alert" className="mt-4 rounded-lg border border-medium/40 bg-medium-bg p-3 text-sm text-medium">{msg}</p>}
      {res && (
        <section className="mt-5" aria-label="Result">
          {res.stop ? (
            <div role="alert" className="rounded-lg border-2 border-high bg-high-bg p-5 text-high">
              <h2 className="text-lg font-bold">Stopped: {res.stop.reason}</h2><p className="mt-1 text-sm">{res.summary}</p>
            </div>
          ) : (
            <>
              {res.stored && (
                <div className="card mb-3 rounded-lg border-2 border-accent bg-card p-5" aria-label="Stored brief for this contract">
                  <h2 className="text-lg font-bold">Brief ready: {res.stored.counterparty}</h2>
                  <p className="text-sm text-muted">{res.stored.doc_type}</p>
                  <p className="mt-2 text-sm leading-relaxed">{res.stored.headline}</p>
                  <p className="mt-2 text-sm"><b>{res.stored.high}</b> High, <b>{res.stored.medium}</b> Medium, <b>{res.stored.low}</b> worth knowing. {res.stored.quotes_checked} quotes checked against the source files just now{res.stored.withheld ? `; ${res.stored.withheld} finding(s) withheld` : "; none withheld"}.</p>
                  <ul className="mt-3 grid gap-1 text-sm">{res.stored.findings.map((f) => <li key={f.id}><SeverityBadge s={f.severity as "High" | "Medium"} /> <Link className="text-accent underline" href={`/brief/${res.stored!.slug}#${f.id}`}>{f.title}</Link> <span className="text-xs text-muted">{f.clause_ref}</span></li>)}</ul>
                  <Link href={`/brief/${res.stored.slug}`} className="mt-4 inline-block rounded bg-accent px-4 py-2.5 text-sm font-medium text-white hover:opacity-90">Open the full brief</Link>
                  <p className="mt-3 text-xs text-muted">The quick rule check on the same text is below. It finds only the wording its rules look for, so it can show fewer points than the brief.</p>
                </div>
              )}
              <p className="rounded-lg border border-rule bg-card p-4 text-sm" role="status"><span className="font-semibold">{name ? `${name}: ` : ""}</span>{res.summary}</p>
              {res.exposure.length > 0 && <div className="card mt-3 rounded-lg border border-rule bg-card p-4"><h2 className="text-base font-semibold">Exposure</h2>{res.exposure.map((x, i) => <p key={i} className="mt-1 text-sm"><span className="font-medium">{x.label}:</span> {x.calculation}, that is <span className="font-semibold">{x.result}</span>.</p>)}</div>}
              <ul className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-3">
                {res.findings.map((f) => (
                  <li key={f.id} className={`card rounded-lg border border-rule border-l-4 bg-card p-4 ${f.severity === "High" ? "border-l-high" : f.severity === "Medium" ? "border-l-medium" : "border-l-low"}`}>
                    <div className="flex flex-wrap items-center gap-2"><SeverityBadge s={f.severity} /><Chip tone="accent">{TYPE_LABEL[f.type] ?? f.type}</Chip><Chip>{f.id}</Chip><Chip>{f.clause_ref}</Chip></div>
                    <h3 className="mt-2 text-lg font-bold">{f.title}</h3>
                    <blockquote className="quote mt-2 text-sm">“{show(f.quote)}”<span className="block text-xs text-muted not-italic">From the text you provided</span></blockquote>
                    <p className="mt-2 text-sm leading-relaxed">{f.explanation}</p>
                    <p className="mt-2 text-sm"><span className="font-semibold">To decide: </span>{f.ask}</p>
                    <p className="mt-1 text-xs text-muted">Rule used: {f.rule}</p>
                    {reviewer && f.register && f.register.length > 0 && (
                      <details className="mt-2 rounded border border-accent/30 bg-accent-bg p-3 text-sm"><summary className="font-semibold text-accent">What AtliQ has already signed that may be touched ({f.register.length} register entr{f.register.length === 1 ? "y" : "ies"})</summary>
                        <ul className="mt-2 grid gap-2">{f.register.map((r) => <li key={r.entry_id}><span className="font-medium">{r.contract}, {r.clause_ref}</span> <Chip>{r.entry_id}</Chip>{r.label && <Chip tone={r.label === "waved_through" ? "warn" : "ok"}>{r.label.replace("_", " ")}</Chip>}<blockquote className="quote quote-signed mt-1 text-xs">“{show(r.quote)}”</blockquote></li>)}</ul>
                      </details>
                    )}
                  </li>
                ))}
                {res.findings.length === 0 && <li className="card rounded-lg border border-rule bg-card p-4 text-sm">No findings from the checks that ran.</li>}
              </ul>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="card rounded-lg border border-rule bg-card p-4"><h2 className="text-base font-semibold">Data type</h2><p className="mt-1 text-sm"><span className="font-medium">{res.dataClass.cls}.</span> {show(res.dataClass.basis)}</p>{res.dataClass.question && <p className="mt-1 text-sm"><span className="font-semibold">Question to ask: </span>{res.dataClass.question}</p>}</div>
                <div className="card rounded-lg border border-medium/40 bg-card p-4"><h2 className="text-base font-semibold">NOT CHECKED</h2><ul className="mt-1 grid gap-1 text-sm">{res.notChecked.map((n, i) => <li key={i}><span className="font-medium">{n.item}.</span> <span className="text-muted">{n.reason}</span></li>)}</ul></div>
              </div>
              <details className="card mt-3 rounded-lg border border-rule bg-card p-4"><summary className="text-base font-semibold">Checks that ran ({res.checks.length})</summary>
                <ul className="mt-2 grid gap-1 text-sm">{res.checks.map((c, i) => <li key={i}><Chip tone={c.status === "ran" ? "ok" : "warn"}>{c.status === "ran" ? "Ran" : "Not checked"}</Chip> <span className="font-medium">{c.check}.</span> <span className="text-muted">{c.result}</span></li>)}</ul>
              </details>
            </>
          )}
          <p className="mt-3 text-xs text-muted">This is a rule check, not an AI reading, and not legal advice. It finds only the wording its rules look for. A result with no findings does not mean the draft is safe. The text you provided is not stored.</p>
        </section>
      )}
    </div>
  );
}
