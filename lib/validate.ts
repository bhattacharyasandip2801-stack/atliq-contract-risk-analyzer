import sources from "@/data/sources.json";

const SRC = sources as Record<string, string>;

/** Same rule as scripts/validate-quotes.mjs: drop markdown emphasis markers, collapse whitespace, then exact match. */
export function norm(s: string): string {
  return s.replace(/\*+/g, "").replace(/(^|\s)_+|_+(\s|$)/g, "$1$2").replace(/\s+/g, " ").trim();
}
const cache = new Map<string, string>();
function srcText(file: string): string | null {
  if (!(file in SRC)) return null;
  let t = cache.get(file);
  if (t === undefined) { t = norm(SRC[file]); cache.set(file, t); }
  return t;
}
export function checkQuote(file: string, quote: string): boolean {
  const t = srcText(file);
  if (t === null) return false;
  const q = norm(quote);
  return q.length >= 8 && t.includes(q);
}
export function sourceExists(file: string) { return file in SRC; }
export function sourceFiles() { return Object.keys(SRC); }

export interface QuoteCheckLog { where: string; file: string; quote: string }
/** Walk any object; every {file, quote} pair is tested. Returns counts and the failures. */
export function auditQuotes(obj: unknown, where = ""): { checked: number; failed: QuoteCheckLog[] } {
  let checked = 0; const failed: QuoteCheckLog[] = [];
  const walk = (o: unknown, path: string) => {
    if (Array.isArray(o)) { o.forEach((x, i) => walk(x, `${path}[${i}]`)); return; }
    if (o && typeof o === "object") {
      const r = o as Record<string, unknown>;
      if (typeof r.quote === "string" && typeof r.file === "string") {
        checked++;
        if (!checkQuote(r.file, r.quote)) failed.push({ where: path, file: r.file, quote: r.quote.slice(0, 160) });
      }
      for (const [k, v] of Object.entries(r)) walk(v, `${path}.${k}`);
    }
  };
  walk(obj, where);
  return { checked, failed };
}
/** Normalised text of one source file (null if the file is not in the dataset). Used to recognise an uploaded simulated contract. */
export function normalisedSource(file: string): string | null { return srcText(file); }
