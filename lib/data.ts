import briefsJson from "@/data/briefs.json";
import registerJson from "@/data/register.json";
import trackerJson from "@/data/tracker.json";
import type { Brief, Register } from "./types";
import { auditQuotes, checkQuote } from "./validate";

export const REGISTER = registerJson as unknown as Register;
export const TRACKER = trackerJson as Record<string, string>[];

/** Deadlines as written in the tracker notes and meeting notes (ISO date for sorting only). */
const DEADLINES: Record<string, string | null> = {
  harrington_health_msa: "2026-10-01", harrington_health_baa: "2026-10-01", finserve_capital_mutual_nda: "2026-10-01",
  marcus_reed_contractor_agreement: "2026-10-01", lakeshore_grocers_msa: "2026-10-03", blueorchid_hotels_pilot_agreement: "2026-10-05",
  daniel_ortiz_contractor_agreement: "2026-10-05", kriti_data_labs_subcontractor_agreement: "2026-10-05", sunrise_foods_sow2: "2026-10-08",
  gulf_crown_hotels_msa: "2026-10-10", datavane_strategic_partnership_agreement: "2026-10-15", rheinwerk_analytics_services_agreement: "2026-10-15",
  daniel_ortiz_nda: null, travelhub_services_agreement: null, loopmart_mutual_nda: null,
};
export function deadlineIso(slug: string) { return DEADLINES[slug] ?? null; }

const RAW = briefsJson as unknown as Brief[];

/** Every brief is re-checked against the source files each time it is served. A finding whose quotes fail is dropped and logged. */
export interface ServedBrief { brief: Brief; quotesChecked: number; dropped: { id: string; reason: string }[] }
const SEV = { High: 3, Medium: 2, Low: 1, None: 0 } as const;

export function serveBrief(raw: Brief): ServedBrief {
  const dropped: { id: string; reason: string }[] = [];
  const findings = raw.findings.filter((f) => {
    const a = auditQuotes(f, f.id);
    if (a.failed.length) { dropped.push({ id: f.id, reason: `${a.failed.length} quote(s) failed exact match` }); return false; }
    return true;
  });
  const brief: Brief = { ...raw, findings };
  const checked = auditQuotes(brief).checked;
  return { brief, quotesChecked: checked, dropped };
}
export function allBriefs(): Brief[] { return RAW; }
export function getBriefRaw(slug: string): Brief | undefined { return RAW.find((b) => b.slug === slug); }
export function getBrief(slug: string): ServedBrief | undefined { const b = getBriefRaw(slug); return b ? serveBrief(b) : undefined; }

export function sortedBriefs(): Brief[] {
  return [...RAW].sort((a, b) => {
    const da = deadlineIso(a.slug), db = deadlineIso(b.slug);
    if (da && db) return da.localeCompare(db) || a.counterparty.localeCompare(b.counterparty);
    if (da) return -1; if (db) return 1;
    return a.counterparty.localeCompare(b.counterparty);
  });
}
export function highestSeverity(b: Brief) {
  let m: keyof typeof SEV = "None";
  for (const f of b.findings) if (SEV[f.severity] > SEV[m]) m = f.severity;
  if (m === "None" && b.low.length) m = "Low";
  return m;
}
export function countBy(b: Brief) {
  return { high: b.findings.filter((f) => f.severity === "High").length, medium: b.findings.filter((f) => f.severity === "Medium").length, low: b.low.length };
}
export { checkQuote };
