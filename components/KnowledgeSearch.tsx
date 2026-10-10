"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useActor } from "./RoleProvider";
import { logAudit } from "@/lib/store";
import { Chip } from "./Badges";
import { GLOSSARY, GLOSSARY_NOTE } from "@/lib/glossary";
import { TOPICS } from "@/lib/topics";

interface Hit { file: string; kind: string; title: string; section: string; passage: string; score: number }
interface Lib { file: string; kind: string; title: string; date: string; passages: number }
interface Doc { file: string; kind: string; title: string; text: string }
interface Ans { status: string; answer: string; citations: { n: number; title: string; section: string; kind: string; file: string; quote: string }[]; note?: string; usage?: { passages: number; model?: string } }
interface Ai { enabled: boolean; provider: string | null; model: string | null; missing: string[] }
const KINDS = ["", "Signed contract", "Incoming draft", "Meeting note", "Negotiation notes", "Karandeep's checklist", "Entity sheet", "Tracker"];
const IDEAS = ["What did we promise Al Noor?", "What is our payment rule?", "Which entity serves US clients?", "Which signed contracts have most favoured customer pricing?", "When was something waved through under time pressure?", "Who must sign before PHI is shared?"];
const TONE: Record<string, "accent" | "warn" | "ok" | "plain"> = { "Signed contract": "accent", "Incoming draft": "warn", "Negotiation notes": "ok" };
const show = (s: string) => s.replace(/\*+/g, "");
const srcName = (f: string) => f.split("/").pop()!.replace(/\.(md|csv)$/, "");
const RECENT = "atliq_kb_recent";

function mark(text: string, q: string) {
  const words = [...new Set(q.toLowerCase().split(/[^a-z0-9$%§]+/).filter((w) => w.length > 3))];
  if (!words.length) return text;
  const re = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return text.split(re).map((p, i) => (i % 2 ? <mark key={i} className="rounded bg-medium-bg px-0.5 text-ink">{p}</mark> : p));
}
function readRecent(): string[] { try { const v = JSON.parse(localStorage.getItem(RECENT) ?? "[]"); return Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 6) : []; } catch { return []; } }
function writeRecent(v: string[]) { try { localStorage.setItem(RECENT, JSON.stringify(v)); } catch { /* storage can be blocked */ } }

export default function KnowledgeSearch({ stats, library }: { stats: { files: number; passages: number }; library: Lib[] }) {
  const actor = useActor();
  const [q, setQ] = useState(""), [kind, setKind] = useState("");
  const [hits, setHits] = useState<Hit[] | null>(null), [busy, setBusy] = useState(false), [err, setErr] = useState<string | null>(null), [asked, setAsked] = useState("");
  const [ai, setAi] = useState<Ai | null>(null), [ans, setAns] = useState<Ans | null>(null), [aiBusy, setAiBusy] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [doc, setDoc] = useState<Doc | null>(null), [docBusy, setDocBusy] = useState(false), [docErr, setDocErr] = useState<string | null>(null), [focus, setFocus] = useState(""), [copied, setCopied] = useState(false);
  const [openTerm, setOpenTerm] = useState<string | null>(null);
  const markRef = useRef<HTMLElement | null>(null), readerRef = useRef<HTMLElement | null>(null);

  useEffect(() => { fetch("/api/answer").then((r) => r.json()).then(setAi).catch(() => setAi(null)); Promise.resolve().then(() => setRecent(readRecent())); }, []);
  useEffect(() => { if (doc) markRef.current?.scrollIntoView({ block: "center" }); }, [doc, focus]);

  const byKind = useMemo(() => KINDS.slice(1).map((k) => ({ kind: k, items: library.filter((l) => l.kind === k) })).filter((g) => g.items.length), [library]);

  async function search(query: string) {
    if (query.trim().length < 2) return;
    setBusy(true); setErr(null); setAns(null); setAsked(query); setDoc(null);
    try {
      const r = await fetch(`/api/knowledge?q=${encodeURIComponent(query)}${kind ? `&kind=${encodeURIComponent(kind)}` : ""}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Search failed");
      setHits(j.hits); logAudit(actor, "knowledge search", "knowledge base", `${query.slice(0, 100)} (${j.hits.length} passages)`);
      const next = [query.trim(), ...readRecent().filter((x) => x !== query.trim())].slice(0, 6); writeRecent(next); setRecent(next);
    } catch (e) { setErr((e as Error).message); setHits(null); } finally { setBusy(false); }
  }
  async function open(file: string, passage = "") {
    setDocBusy(true); setDocErr(null); setFocus(passage); setCopied(false);
    try {
      const r = await fetch(`/api/knowledge?file=${encodeURIComponent(file)}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Could not open the document");
      setDoc(j); logAudit(actor, "knowledge read", file, srcName(file));
      requestAnimationFrame(() => readerRef.current?.scrollIntoView({ block: "nearest" }));
    } catch (e) { setDocErr((e as Error).message); setDoc(null); } finally { setDocBusy(false); }
  }
  async function ask() {
    setAiBusy(true); setAns(null);
    try {
      const r = await fetch("/api/answer", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ q: asked }) });
      const j = await r.json();
      setAns(r.ok ? j : { status: "error", answer: "", citations: [], note: j.error ?? "Failed" });
      logAudit(actor, "ai answer", "knowledge base", `${asked.slice(0, 100)} → ${r.ok ? j.status : "error"}`);
    } catch { setAns({ status: "error", answer: "", citations: [], note: "The request failed." }); } finally { setAiBusy(false); }
  }
  function clearAll() { setHits(null); setAsked(""); setQ(""); setDoc(null); setDocErr(null); setAns(null); setErr(null); }
  async function copy(text: string) { try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* clipboard can be blocked */ } }

  const docDocs = hits ? new Set(hits.map((h) => h.file)).size : 0;
  const lib = doc ? library.find((l) => l.file === doc.file) : undefined;
  const at = doc && focus ? doc.text.indexOf(focus) : -1;
  const parts = doc ? (at >= 0 ? [doc.text.slice(0, at), doc.text.slice(at, at + focus.length), doc.text.slice(at + focus.length)] : [doc.text, "", ""]) : [];
  const citation = doc ? `${doc.title}${lib?.date ? ` (${lib.date})` : ""}, file ${srcName(doc.file)}${focus ? `: “${show(focus).slice(0, 400)}”` : ""}` : "";

  const stat = (n: number | string, label: string) => <div className="rounded-lg border border-rule bg-card px-4 py-3"><div className="text-xl font-bold tabular-nums">{n}</div><div className="text-xs text-muted">{label}</div></div>;

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6" aria-label="Knowledge base at a glance">
        {stat(stats.files, "documents")}{stat(stats.passages, "passages searched")}
        {stat(library.filter((l) => l.kind === "Signed contract").length, "signed contracts")}
        {stat(library.filter((l) => l.kind === "Incoming draft").length, "incoming drafts")}
        {stat(library.filter((l) => l.kind === "Meeting note" || l.kind === "Negotiation notes").length, "notes")}
        {stat(GLOSSARY.length, "terms explained")}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); search(q); }} className="mt-5 flex flex-wrap items-end gap-2" role="search">
        <label className="min-w-0 flex-1 text-xs text-muted">Ask a question or type a few words
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. non-compete Gulf hospitality" className="mt-1 block w-full rounded border border-rule bg-card p-2.5 text-sm text-ink" />
        </label>
        <label className="text-xs text-muted">Look in
          <select value={kind} onChange={(e) => setKind(e.target.value)} className="mt-1 block rounded border border-rule bg-card p-2.5 text-sm text-ink">
            {KINDS.map((k) => <option key={k} value={k}>{k || "Everything"}</option>)}
          </select>
        </label>
        <button disabled={busy} className="rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60">{busy ? "Searching…" : "Search"}</button>
        {(hits || doc) && <button type="button" onClick={clearAll} className="rounded border border-rule bg-card px-4 py-2.5 text-sm hover:bg-accent-bg">Clear</button>}
      </form>
      <p className="mt-2 text-xs text-muted">Every passage shown is copied word for word from its file and re-checked against it. Nothing is written or guessed by the search.</p>

      {err && <p role="alert" className="mt-4 rounded-lg border border-high/40 bg-high-bg p-3 text-sm text-high">{err}</p>}

      {!hits && !doc && (
        <div className="mt-5 grid gap-5">
          <section aria-label="Browse by topic" className="card rounded-lg border border-rule bg-card p-4">
            <h2 className="text-base font-semibold">Browse by topic</h2>
            <p className="mt-1 text-xs text-muted">Each tile searches the {stats.files} documents for that subject and shows the exact passages.</p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {TOPICS.map((t) => <li key={t.title}><button onClick={() => { setQ(t.query); search(t.query); }} className="h-full w-full rounded-lg border border-rule bg-paper p-3 text-left hover:border-accent hover:bg-accent-bg"><span className="block text-sm font-semibold">{t.title}</span><span className="mt-0.5 block text-xs text-muted">{t.hint}</span></button></li>)}
            </ul>
          </section>

          <section aria-label="Try a question" className="card rounded-lg border border-rule bg-card p-4">
            <h2 className="text-base font-semibold">Try a question</h2>
            <div className="mt-2 flex flex-wrap gap-2">{IDEAS.map((i) => <button key={i} onClick={() => { setQ(i); search(i); }} className="rounded-full border border-rule bg-card px-3 py-1 text-xs hover:bg-accent-bg">{i}</button>)}</div>
            {recent.length > 0 && <>
              <h3 className="mt-4 text-sm font-semibold">Your recent searches</h3>
              <div className="mt-2 flex flex-wrap gap-2">{recent.map((r) => <button key={r} onClick={() => { setQ(r); search(r); }} className="rounded-full border border-rule bg-paper px-3 py-1 text-xs hover:bg-accent-bg">{r}</button>)}
                <button onClick={() => { writeRecent([]); setRecent([]); }} className="px-2 py-1 text-xs text-muted underline">Clear recent</button></div>
              <p className="mt-1 text-xs text-muted">Kept only in this browser.</p></>}
          </section>

          <section aria-label="Library" className="card rounded-lg border border-rule bg-card p-4">
            <h2 className="text-base font-semibold">Library: all {stats.files} documents</h2>
            <p className="mt-1 text-xs text-muted">Select a document to read it in full. Dates come from the file names.</p>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              {byKind.map((g) => (
                <div key={g.kind}>
                  <h3 className="flex items-center gap-2 text-sm font-semibold"><Chip tone={TONE[g.kind] ?? "plain"}>{g.kind}</Chip><span className="text-xs font-normal text-muted">{g.items.length}</span></h3>
                  <ul className="mt-1 divide-y divide-rule">
                    {g.items.map((l) => <li key={l.file}><button onClick={() => open(l.file)} className="flex w-full items-baseline justify-between gap-3 py-1.5 text-left text-sm hover:text-accent"><span className="min-w-0 truncate">{l.title}</span><span className="shrink-0 text-xs text-muted tabular-nums">{l.date || `${l.passages} passages`}</span></button></li>)}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {hits && hits.length === 0 && <p role="status" className="card mt-4 rounded-lg border border-rule bg-card p-4 text-sm">Nothing in the knowledge base matches “{asked}”. That does not mean it does not exist: the knowledge base is only the {stats.files} dataset files, and the register covers 17 of about 30 signed contracts. Try fewer or different words, or look in the library.</p>}

      {(hits && hits.length > 0 || doc || docBusy || docErr) && (
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          {hits && hits.length > 0 && (
            <div className={doc || docBusy ? "hidden lg:block" : ""}>
              <p role="status" className="text-sm"><strong>{hits.length} passage{hits.length === 1 ? "" : "s"}</strong> from {docDocs} document{docDocs === 1 ? "" : "s"} for “{asked}”. Select one to read it in context.</p>
              <section className="card mt-3 rounded-lg border border-rule bg-card p-4" aria-label="AI answer">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold">Short answer (optional AI)</h2>
                  <Chip tone={ai?.enabled ? "ok" : "plain"}>{ai ? (ai.enabled ? `On: ${ai.provider}` : "Off") : "…"}</Chip>
                </div>
                {ai && !ai.enabled && <p className="mt-1 text-sm text-muted">The AI layer is off, which is fine: the passages are the answer. To switch it on, the owner sets {ai.missing.length} setting{ai.missing.length === 1 ? "" : "s"} in Vercel ({ai.missing.map((m) => m.split(" ")[0]).join(", ")}). See the README.</p>}
                {ai?.enabled && !ans && <div className="mt-2"><button onClick={ask} disabled={aiBusy} className="rounded border border-rule bg-card px-3 py-1.5 text-sm hover:bg-accent-bg disabled:opacity-60">{aiBusy ? "Writing…" : "Write a short answer"}</button><span className="ml-2 text-xs text-muted">It can only use these passages, and every quote it cites is checked.</span></div>}
                {ans && (
                  <div className="mt-2 text-sm" role="status">
                    {ans.status === "answered" ? <><p className="leading-relaxed">{ans.answer}</p>
                      <ul className="mt-2 grid gap-1">{ans.citations.map((c, i) => <li key={i} className="text-xs"><span className="font-medium">{c.title}{c.section ? `, ${show(c.section)}` : ""}:</span> <span className="quote">“{show(c.quote)}”</span></li>)}</ul>
                      <p className="mt-2 text-xs text-muted">{ans.citations.length} quote{ans.citations.length === 1 ? "" : "s"} verified word for word. This is a summary, not legal advice.</p></>
                      : <p className="rounded bg-medium-bg p-3 text-medium">{ans.note}</p>}
                  </div>
                )}
              </section>
              <ul className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-3">
                {hits.map((h, i) => {
                  const on = doc?.file === h.file && focus === h.passage;
                  return (
                    <li key={i} className={`card rounded-lg border bg-card p-4 ${on ? "border-accent" : "border-rule"}`}>
                      <div className="flex flex-wrap items-center gap-2"><Chip tone={TONE[h.kind] ?? "plain"}>{h.kind}</Chip><span className="text-sm font-semibold">{h.title}</span>{h.section && <span className="text-sm text-muted">{show(h.section).slice(0, 80)}</span>}</div>
                      <blockquote className="quote mt-2 whitespace-pre-wrap text-sm">{mark(show(h.passage.length > 600 ? h.passage.slice(0, 600) + " …" : h.passage), asked)}</blockquote>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs"><span className="text-muted">Source: {srcName(h.file)}</span>
                        <button onClick={() => open(h.file, h.passage)} aria-pressed={on} className="rounded border border-rule px-2 py-1 font-medium text-accent hover:bg-accent-bg">{on ? "Open in reader" : "Read in context"}</button></div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {(doc || docBusy || docErr) && (
            <section ref={readerRef} aria-label="Document reader" className={`card self-start rounded-lg border border-rule bg-card ${hits && hits.length > 0 ? "lg:sticky lg:top-4" : "lg:col-span-2"}`}>
              {docBusy && <p role="status" className="p-4 text-sm text-muted">Opening the document…</p>}
              {docErr && <p role="alert" className="m-4 rounded bg-high-bg p-3 text-sm text-high">{docErr}</p>}
              {doc && !docBusy && (
                <>
                  <div className="border-b border-rule p-4">
                    <div className="flex flex-wrap items-center gap-2"><Chip tone={TONE[doc.kind] ?? "plain"}>{doc.kind}</Chip><h2 className="text-base font-semibold">{doc.title}</h2></div>
                    <p className="mt-1 text-xs text-muted">File {srcName(doc.file)}{lib?.date ? ` · file date ${lib.date}` : ""} · {lib?.passages ?? 0} passages · {doc.text.length.toLocaleString("en-US")} characters</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      {hits && hits.length > 0 && <button onClick={() => { setDoc(null); setFocus(""); }} className="rounded border border-rule px-2 py-1 hover:bg-accent-bg lg:hidden">← Back to results</button>}
                      <button onClick={() => { setDoc(null); setFocus(""); setDocErr(null); }} className="hidden rounded border border-rule px-2 py-1 hover:bg-accent-bg lg:inline-block">Close</button>
                      <button onClick={() => copy(citation)} className="rounded border border-rule px-2 py-1 hover:bg-accent-bg">{copied ? "Copied" : "Copy citation"}</button>
                      <span className="self-center text-muted" role="status">{focus ? (at >= 0 ? "The matching passage is highlighted." : "The passage could not be located in the file.") : ""}</span>
                    </div>
                  </div>
                  <div className="max-h-[70vh] overflow-auto p-4" tabIndex={0} aria-label="Full document text">
                    <div className="quote whitespace-pre-wrap text-sm">{show(parts[0])}{parts[1] && <mark ref={(el) => { markRef.current = el; }} className="rounded bg-medium-bg px-0.5 text-ink">{show(parts[1])}</mark>}{show(parts[2])}</div>
                  </div>
                </>
              )}
            </section>
          )}
        </div>
      )}

      <section aria-label="Terms in plain English" className="card mt-6 rounded-lg border border-rule bg-card p-4">
        <div className="flex flex-wrap items-center gap-2"><h2 className="text-base font-semibold">Terms in plain English</h2><Chip>General information, not from AtliQ&apos;s files</Chip></div>
        <p className="mt-1 text-xs text-muted">{GLOSSARY_NOTE}</p>
        <ul className="mt-3 grid gap-2 md:grid-cols-2">
          {GLOSSARY.map((t) => {
            const on = openTerm === t.term;
            return (
              <li key={t.term} className="rounded border border-rule">
                <button onClick={() => setOpenTerm(on ? null : t.term)} aria-expanded={on} className="flex w-full items-center justify-between gap-2 p-2.5 text-left text-sm font-medium hover:bg-accent-bg">{t.term}<span aria-hidden className="text-muted">{on ? "−" : "+"}</span></button>
                {on && <div className="border-t border-rule p-2.5 text-sm"><p>{t.meaning}</p><p className="mt-1 text-muted"><strong className="font-medium text-ink">What to check:</strong> {t.why}</p>
                  <button onClick={() => { setQ(t.search); search(t.search); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="mt-2 rounded border border-rule px-2 py-1 text-xs font-medium text-accent hover:bg-accent-bg">Find this in our files</button></div>}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
