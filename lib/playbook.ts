// Playbook: Karandeep's own written rules, past negotiations and recorded exceptions, read from the dataset files.
// Nothing here is written by the tool. Lines are copied from checklist and negotiation notes; labels come from the register.
import sources from "@/data/sources.json";
import { REGISTER, allBriefs } from "./data";

const S = sources as Record<string, string>;
const strip = (s: string) => s.replace(/\*+/g, "").trim();

export function checklistRules(): string[] {
  const top = S["karandeep_contract_checklist.md"].split(/\n---\n/)[0];
  return top.split("\n").filter((l) => /^- /.test(l)).map((l) => l.slice(2).trim());
}
export function checklistExtra(): string { return strip(S["karandeep_contract_checklist.md"].split(/\n---\n/)[0].split("\n").find((l) => /^check SOW/i.test(l)) ?? ""); }
export function karandeepNote(): string[] {
  const rest = S["karandeep_contract_checklist.md"].split(/\n---\n/)[1] ?? "";
  return rest.split(/\n\s*\n/).map((p) => strip(p)).filter((p) => p && !/^Internal note/i.test(p));
}
export interface Case { title: string; lines: string[]; match: string | null }
const MATCH: [RegExp, string][] = [
  [/Crestline/, "Crestline"], [/PayTrack/, "PayTrack"], [/Rohan Iyer/, "Rohan Iyer"], [/Acme/, "Acme"], [/Al Noor/, "Al Noor"], [/Northwind/, "Northwind"], [/CloudSpan/, "CloudSpan"],
  [/CareBridge/, "CareBridge"], [/Brightwater/, "Brightwater"], [/Meridian/, "Meridian"], [/Trustline/, "Trustline"], [/Harrington/, "Harrington"],
];
export function cases(): Case[] {
  const body = S["negotiation_notes.md"].split(/\n---\n/)[1] ?? "";
  return body.split(/\n\s*\n(?=\*\*)/).map((b) => b.trim()).filter((b) => b.startsWith("**")).map((b) => {
    const [head, ...rest] = b.split("\n");
    return { title: strip(head), lines: rest.map((l) => strip(l.replace(/^- /, ""))).filter(Boolean), match: MATCH.find(([re]) => re.test(head))?.[1] ?? null };
  });
}
export function caseLabels(c: Case) {
  if (!c.match) return null;
  const es = REGISTER.entries.filter((e) => e.counterparty.includes(c.match!));
  if (!es.length) return null;
  const n = (l: string) => es.filter((e) => e.exception_label === l).length;
  return { deliberate: n("deliberate"), waved: n("waved_through"), unlabelled: n("unlabelled"), total: es.length };
}
export function exceptionsOnRecord() {
  const by = new Map<string, { contract: string; deliberate: number; waved: number }>();
  for (const e of REGISTER.entries) {
    if (e.exception_label !== "deliberate" && e.exception_label !== "waved_through") continue;
    const row = by.get(e.counterparty) ?? { contract: e.counterparty, deliberate: 0, waved: 0 };
    if (e.exception_label === "deliberate") row.deliberate++; else row.waved++;
    by.set(e.counterparty, row);
  }
  return [...by.values()].sort((a, b) => b.waved - a.waved || b.deliberate - a.deliberate);
}
/** Which checklist line a stored finding's rule belongs to. This mapping is the product owner's proposal. */
export const RULE_FOR: { line: RegExp; rules: string[] }[] = [
  { line: /^LDs/i, rules: ["R-01"] }, { line: /^liability/i, rules: ["R-03"] }, { line: /^indemnity/i, rules: ["R-04"] }, { line: /^payment/i, rules: ["R-05"] },
  { line: /^gov law/i, rules: ["R-06", "R-11", "R-12"] }, { line: /^IP/i, rules: ["R-07"] }, { line: /^termination/i, rules: ["R-08"] }, { line: /^(confidentiality|NDAs)/i, rules: ["R-09"] },
];
export function draftsHitting(line: string): { slug: string; counterparty: string; n: number }[] {
  const rules = RULE_FOR.find((r) => r.line.test(line))?.rules ?? [];
  return allBriefs().map((b) => ({ slug: b.slug, counterparty: b.counterparty, n: b.findings.filter((f) => rules.includes(f.rule)).length })).filter((x) => x.n > 0);
}
export function entityLines(): string[] {
  return S["atliq_entities.md"].split("\n").filter((l) => /^\| (Serves|Authorised signatory|Type) /.test(l) || /^## [12]\./.test(l)).map((l) => strip(l.replace(/^## /, "")).replace(/\|/g, " ").replace(/\s+/g, " ").trim());
}
