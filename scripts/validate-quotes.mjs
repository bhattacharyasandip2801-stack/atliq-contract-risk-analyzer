// Quote validator: every quote in register.json and briefs/*.json must appear in its source file.
// Matching rule: exact string match after (a) removing markdown emphasis markers (* and _ runs used for bold/italic),
// (b) collapsing all whitespace runs to one space. No other changes: words, numbers and punctuation must match.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const ds = path.join(root, "data", "dataset");

export function norm(s) {
  return s
    .replace(/\*+/g, "")
    .replace(/(^|\s)_+|_+(\s|$)/g, "$1$2")
    .replace(/\s+/g, " ")
    .trim();
}

const cache = new Map();
export function sourceText(rel) {
  if (!cache.has(rel)) {
    const p = path.join(ds, rel);
    if (!fs.existsSync(p)) return null;
    cache.set(rel, norm(fs.readFileSync(p, "utf8")));
  }
  return cache.get(rel);
}

export function checkQuote(file, quote) {
  const t = sourceText(file);
  if (t === null) return { ok: false, why: "source file not found: " + file };
  const q = norm(quote);
  if (q.length < 8) return { ok: false, why: "quote too short" };
  return t.includes(q) ? { ok: true } : { ok: false, why: "quote not found in " + file };
}

function walkQuotes(obj, out, ctx) {
  if (Array.isArray(obj)) return obj.forEach((x) => walkQuotes(x, out, ctx));
  if (obj && typeof obj === "object") {
    if (typeof obj.quote === "string" && typeof obj.file === "string") out.push({ file: obj.file, quote: obj.quote, ctx });
    for (const [k, v] of Object.entries(obj)) walkQuotes(v, out, ctx + "/" + k);
  }
}

if (process.argv[1] && process.argv[1].endsWith("validate-quotes.mjs")) {
  const targets = process.argv.slice(2);
  const files = targets.length
    ? targets
    : [
        "data/register.json",
        ...(fs.existsSync(path.join(root, "data/briefs"))
          ? fs.readdirSync(path.join(root, "data/briefs")).filter((f) => f.endsWith(".json") && !f.startsWith("_")).map((f) => "data/briefs/" + f)
          : []),
        ...(fs.existsSync(path.join(root, "data/sample_briefs"))
          ? fs.readdirSync(path.join(root, "data/sample_briefs")).filter((f) => f.endsWith(".json")).map((f) => "data/sample_briefs/" + f)
          : []),
      ];
  let bad = 0, total = 0;
  for (const f of files) {
    const p = path.join(root, f);
    if (!fs.existsSync(p)) { console.log("missing", f); continue; }
    const j = JSON.parse(fs.readFileSync(p, "utf8"));
    const qs = [];
    walkQuotes(j, qs, "");
    for (const q of qs) {
      total++;
      const r = checkQuote(q.file, q.quote);
      if (!r.ok) { bad++; console.log(`FAIL ${f} ${q.ctx}: ${r.why}\n   "${q.quote.slice(0, 120)}"`); }
    }
    console.log(`${f}: ${qs.length} quotes`);
  }
  console.log(`checked ${total} quotes, ${bad} failed`);
  process.exit(bad ? 1 : 0);
}
