"use client";
import { useEffect, useState } from "react";
import { useActor } from "./RoleProvider";
import { logAudit } from "@/lib/store";
import { Chip } from "./Badges";

interface Hit { file: string; kind: string; title: string; section: string; passage: string; score: number }
interface Ans { status: string; answer: string; citations: { n: number; title: string; section: string; kind: string; file: string; quote: string }[]; note?: string; usage?: { passages: number; model?: string } }
interface Ai { enabled: boolean; provider: string | null; model: string | null; missing: string[] }
const KINDS = ["", "Signed contract", "Incoming draft", "Meeting note", "Negotiation notes", "Karandeep's checklist", "Entity sheet", "Tracker"];
const IDEAS = ["What did we promise Al Noor?", "What is our payment rule?", "Which entity serves US clients?", "Which signed contracts have most favoured customer pricing?", "When was something waved through under time pressure?", "Who must sign before PHI is shared?"];
const SEEN: Record<string, string> = { "Signed contract": "accent", "Incoming draft": "warn", "Negotiation notes": "ok" };
const show = (s: string) => s.replace(/\*+/g, "");
const srcName = (f: string) => f.split("/").pop()!.replace(/\.(md|csv)$/, "");

function mark(text: string, q: string) {
  const words = [...new Set(q.toLowerCase().split(/[^a-z0-9$%§]+/).filter((w) => w.length > 3))];
  if (!words.length) return text;
  const re = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return text.split(re).map((p, i) => (i % 2 ? <mark key={i} className="rounded bg-medium-bg px-0.5 text-ink">{p}</mark> : p));
}

export default function KnowledgeSearch({ stats }: { stats: { files: number; passages: number } }) {
  const actor = useActor();
  const [q, setQ] = useState(""), [kind, setKind] = useState("");
  const [hits, setHits] = useState<Hit[] | null>(null), [busy, setBusy] = useState(false), [err, setErr] = useState<string | null>(null), [asked, setAsked] = useState("");
  const [ai, setAi] = useState<Ai | null>(null), [ans, setAns] = useState<Ans | null>(null), [aiBusy, setAiBusy] = useState(false);
  useEffect(() => { fetch("/api/answer").then((r) => r.json()).then(setAi).catch(() => setAi(null)); }, []);

  async function search(query: string) {
    if (query.trim().length < 2) return;
    setBusy(true); setErr(null); setAns(null); setAsked(query);
    try {
      const r = await fetch(`/api/knowledge?q=${encodeURIComponent(query)}${kind ? `&kind=${encodeURIComponent(kind)}` : ""}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Search failed");
      setHits(j.hits); logAudit(actor, "knowledge search", "knowledge base", `${query.slice(0, 100)} (${j.hits.length} passages)`);
    } catch (e) { setErr((e as Error).message); setHits(null); } finally { setBusy(false); }
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

  return (
    <div>
      <form onSubmit={(e) => { e.preventDefault(); search(q); }} className="flex flex-wrap items-end gap-2" role="search">
        <label className="min-w-0 flex-1 text-xs text-muted">Ask a question or type a few words
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. non-compete Gulf hospitality" className="mt-1 block w-full rounded border border-rule bg-card p-2.5 text-sm text-ink" />
        </label>
        <label className="text-xs text-muted">Look in
          <select value={kind} onChange={(e) => setKind(e.target.value)} className="mt-1 block rounded border border-rule bg-card p-2.5 text-sm text-ink">
            {KINDS.map((k) => <option key={k} value={k}>{k || "Everything"}</option>)}
          </select>
        </label>
        <button disabled={busy} className="rounded bg-accent px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60">{busy ? "Searching…" : "Search"}</button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2" aria-label="Example questions">
        {IDEAS.map((i) => <button key={i} onClick={() => { setQ(i); search(i); }} className="rounded-full border border-rule bg-card px-3 py-1 text-xs hover:bg-accent-bg">{i}</button>)}
      </div>
      <p className="mt-3 text-xs text-muted">Searches {stats.files} files in {stats.passages} passages. Every passage shown is copied word for word from its file and re-checked against it. Nothing is written or guessed by the search.</p>
      {err && <p role="alert" className="mt-4 rounded-lg border border-high/40 bg-high-bg p-3 text-sm text-high">{err}</p>}
      {hits && hits.length === 0 && <p role="status" className="card mt-4 rounded-lg border border-rule bg-card p-4 text-sm">Nothing in the knowledge base matches “{asked}”. That does not mean it does not exist: the knowledge base is only the {stats.files} dataset files, and the register covers 17 of about 30 signed contracts.</p>}
      {hits && hits.length > 0 && (
        <>
          <section className="card mt-4 rounded-lg border border-rule bg-card p-4" aria-label="AI answer">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold">Short answer from these passages (optional AI)</h2>
              <Chip tone={ai?.enabled ? "ok" : "plain"}>{ai ? (ai.enabled ? `On: ${ai.provider}` : "Off") : "…"}</Chip>
            </div>
            {ai && !ai.enabled && <p className="mt-1 text-sm text-muted">The AI layer is off, which is fine: the passages below are the answer. To switch it on, the owner sets {ai.missing.length} setting{ai.missing.length === 1 ? "" : "s"} in Vercel ({ai.missing.map((m) => m.split(" ")[0]).join(", ")}). See the README.</p>}
            {ai?.enabled && !ans && <div className="mt-2"><button onClick={ask} disabled={aiBusy} className="rounded border border-rule bg-card px-3 py-1.5 text-sm hover:bg-accent-bg disabled:opacity-60">{aiBusy ? "Writing…" : "Write a short answer"}</button><span className="ml-2 text-xs text-muted">It can only use the passages below, and every quote it cites is checked.</span></div>}
            {ans && (
              <div className="mt-2 text-sm" role="status">
                {ans.status === "answered" ? <><p className="leading-relaxed">{ans.answer}</p>
                  <ul className="mt-2 grid gap-1">{ans.citations.map((c, i) => <li key={i} className="text-xs"><span className="font-medium">{c.title}{c.section ? `, ${show(c.section)}` : ""}:</span> <span className="quote">“{show(c.quote)}”</span></li>)}</ul>
                  <p className="mt-2 text-xs text-muted">{ans.citations.length} quote{ans.citations.length === 1 ? "" : "s"} verified word for word. This is a summary, not legal advice.</p></>
                  : <p className="rounded bg-medium-bg p-3 text-medium">{ans.note}</p>}
              </div>
            )}
          </section>
          <ul className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-3">
            {hits.map((h, i) => (
              <li key={i} className="card rounded-lg border border-rule bg-card p-4">
                <div className="flex flex-wrap items-center gap-2"><Chip tone={(SEEN[h.kind] as "accent" | "warn" | "ok") ?? "plain"}>{h.kind}</Chip><span className="text-sm font-semibold">{h.title}</span>{h.section && <span className="text-sm text-muted">{show(h.section).slice(0, 80)}</span>}</div>
                <blockquote className="quote mt-2 whitespace-pre-wrap text-sm">{mark(show(h.passage), asked)}</blockquote>
                <p className="mt-1 text-xs text-muted">Source: {srcName(h.file)}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
