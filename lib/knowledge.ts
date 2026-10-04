// Knowledge base: every dataset file split into passages, searched with BM25 (no AI, no embeddings, no key).
// Every passage is an exact slice of its source file, and is re-checked with the same exact-match rule as the briefs.
import sources from "@/data/sources.json";
import { checkQuote } from "./validate";

const SRC = sources as Record<string, string>;

export type Kind = "Signed contract" | "Incoming draft" | "Meeting note" | "Negotiation notes" | "Karandeep's checklist" | "Entity sheet" | "Tracker";
export interface Passage { id: number; file: string; kind: Kind; title: string; section: string; text: string }
export interface Hit extends Passage { score: number }

export function kindOf(file: string): Kind {
  if (file.startsWith("signed_contracts/")) return "Signed contract";
  if (file.startsWith("incoming/")) return "Incoming draft";
  if (file.startsWith("meeting_notes/")) return "Meeting note";
  if (file === "negotiation_notes.md") return "Negotiation notes";
  if (file === "karandeep_contract_checklist.md") return "Karandeep's checklist";
  if (file === "atliq_entities.md") return "Entity sheet";
  return "Tracker";
}
export function titleOf(file: string): string {
  const base = file.split("/").pop()!.replace(/\.(md|csv)$/, "").replace(/^\d{4}-\d{2}-\d{2}_/, "").replace(/_/g, " ");
  return base.replace(/\b\w/g, (c) => c.toUpperCase());
}

const MAX = 1100;
function buildPassages(): Passage[] {
  const out: Passage[] = [];
  for (const file of Object.keys(SRC).sort()) {
    const text = SRC[file];
    const kind = kindOf(file), title = titleOf(file);
    if (kind === "Tracker") {
      let pos = 0;
      for (const line of text.split("\n")) {
        const start = pos; pos += line.length + 1;
        if (!line.trim() || start === 0) continue; // skip the header row
        out.push({ id: out.length, file, kind, title: "Contract tracker", section: line.split(",")[0], text: line });
      }
      continue;
    }
    // split on blank lines, keeping offsets so each passage is an exact slice of the file
    const paras: { s: number; e: number }[] = [];
    const re = /\S[\s\S]*?(?=\n\s*\n|$)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) { paras.push({ s: m.index, e: m.index + m[0].length }); if (m[0].length === 0) re.lastIndex++; }
    let section = "";
    let cur: { s: number; e: number; section: string } | null = null;
    const flush = () => { if (cur) { out.push({ id: out.length, file, kind, title, section: cur.section, text: text.slice(cur.s, cur.e) }); cur = null; } };
    for (const p of paras) {
      const t = text.slice(p.s, p.e);
      if (/^---+$/.test(t.trim())) { flush(); continue; }
      const h = /^#{1,4}\s+(.+)/.exec(t);
      if (h) { flush(); section = h[1].replace(/\*+/g, "").trim(); }
      else { const b = /^\*\*([^*]{3,90})\*\*/.exec(t); if (b && /^(\d+(\.\d+)*[.)]?\s|Article|Section|Schedule|Exhibit|Annex)/i.test(b[1])) section = b[1].trim(); }
      if (cur && p.e - cur.s <= MAX && !h && !/^\*\*/.test(t)) { cur.e = p.e; }
      else { flush(); cur = { s: p.s, e: p.e, section }; }
    }
    flush();
  }
  return out;
}

const STOP = new Set("a an and are as at be by for from has have if in into is it its of on or that the their this to was were will with which who shall may not no any all each such than then there these those other under upon also can per".split(" "));
const SYN: Record<string, string> = {
  ld: "liquidated damages", lds: "liquidated damages", mfn: "most favoured customer favorable", noncompete: "non-compete", phi: "protected health information",
  baa: "business associate agreement", dpa: "data processing agreement", nda: "non-disclosure confidentiality", sow: "statement of work", ip: "intellectual property",
};
function stem(w: string) { return w.length > 4 ? w.replace(/(ing|ed|es|s)$/, "") : w.replace(/s$/, ""); }
export function tokens(s: string): string[] {
  const exp = s.toLowerCase().split(/[^a-z0-9$%§]+/).flatMap((w) => (SYN[w] ? [w, ...SYN[w].split(" ")] : [w]));
  return exp.filter((w) => w.length > 1 && !STOP.has(w)).map(stem);
}

interface Index { passages: Passage[]; tf: Map<string, number>[]; len: number[]; df: Map<string, number>; avg: number }
let IDX: Index | null = null;
function index(): Index {
  if (IDX) return IDX;
  const passages = buildPassages();
  const tf: Map<string, number>[] = [], len: number[] = [], df = new Map<string, number>();
  for (const p of passages) {
    const toks = tokens(`${p.title} ${p.section} ${p.text}`);
    const m = new Map<string, number>();
    for (const t of toks) m.set(t, (m.get(t) ?? 0) + 1);
    for (const t of m.keys()) df.set(t, (df.get(t) ?? 0) + 1);
    tf.push(m); len.push(toks.length);
  }
  IDX = { passages, tf, len, df, avg: len.reduce((a, b) => a + b, 0) / Math.max(1, len.length) };
  return IDX;
}

export const KB_STATS = () => { const i = index(); return { files: Object.keys(SRC).length, passages: i.passages.length }; };

export interface SearchOpts { k?: number; kinds?: Kind[] }
/** BM25 over passages. Returns only passages whose text passes the exact-match check against the source file. */
export function searchKnowledge(query: string, opts: SearchOpts = {}): Hit[] {
  const { passages, tf, len, df, avg } = index();
  const q = [...new Set(tokens(query))];
  if (!q.length) return [];
  const N = passages.length, k1 = 1.4, b = 0.75;
  const hits: Hit[] = [];
  for (let i = 0; i < N; i++) {
    const p = passages[i];
    if (opts.kinds && !opts.kinds.includes(p.kind)) continue;
    let score = 0, matched = 0;
    for (const t of q) {
      const f = tf[i].get(t); if (!f) continue;
      matched++;
      const idf = Math.log(1 + (N - (df.get(t) ?? 0) + 0.5) / ((df.get(t) ?? 0) + 0.5));
      score += idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * len[i]) / avg)));
    }
    if (!matched) continue;
    // passages that contain more of the distinct query words win ties
    score *= 0.6 + 0.4 * (matched / q.length);
    hits.push({ ...p, score });
  }
  hits.sort((a, b2) => b2.score - a.score);
  const out: Hit[] = [];
  for (const h of hits) {
    if (!checkQuote(h.file, h.text)) continue; // never show a passage that is not verbatim in its file
    out.push(h);
    if (out.length >= (opts.k ?? 8)) break;
  }
  return out;
}
export function passageById(id: number): Passage | undefined { return index().passages[id]; }
