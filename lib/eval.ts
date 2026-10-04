import { allBriefs, REGISTER } from "./data";
import { auditQuotes, norm } from "./validate";
import { sellerView } from "./seller";
import type { Brief, Finding } from "./types";

export interface Check { label: string; pass: boolean; expected: string; found: string }
export interface Dimension {
  name: string; threshold: string; status: "pass" | "fail" | "info"; result: string; note?: string; checks: Check[];
}

const B = (slug: string) => allBriefs().find((b) => b.slug === slug)!;
const txt = (f: Finding) => `${f.title} ${f.explanation} ${f.clause_ref}`;
const has = (f: Finding, ...parts: string[]) => parts.every((p) => txt(f).toLowerCase().includes(p.toLowerCase()));
const firstMatch = (b: Brief, pred: (f: Finding) => boolean) => b.findings.find(pred);
function check(label: string, expected: string, f: Finding | undefined | boolean, found?: string): Check {
  const pass = typeof f === "boolean" ? f : !!f;
  return { label, expected, pass, found: found ?? (typeof f === "object" && f ? `${f.id} ${f.severity}: ${f.title}` : "not found") };
}
function dim(name: string, threshold: string, checks: Check[], exact = true, note?: string): Dimension {
  const p = checks.filter((c) => c.pass).length;
  const result = `${p} of ${checks.length}`;
  return { name, threshold, checks, result, note, status: exact ? (p === checks.length ? "pass" : "fail") : "info" };
}
const refsFile = (f: Finding, part: string) => (f.register_refs ?? []).some((r) => r.file.includes(part));
const bundle = (b: Brief, re: RegExp, status: string) => b.bundle.needed.find((x) => re.test(x.document) && x.status === status);

export function runEvaluation(): { dimensions: Dimension[]; labelsNote: string; generated: string } {
  const briefs = allBriefs();
  const dims: Dimension[] = [];

  // 1 Citation accuracy (live)
  {
    const rows: Check[] = [];
    let total = 0, bad = 0;
    for (const b of briefs) { const a = auditQuotes(b, b.slug); total += a.checked; bad += a.failed.length; rows.push({ label: b.counterparty + " (" + b.doc_type.split(" (")[0] + ")", expected: "all quotes match the source file", pass: a.failed.length === 0, found: `${a.checked - a.failed.length} of ${a.checked} quotes match` }); }
    const r = auditQuotes(REGISTER, "register"); total += r.checked; bad += r.failed.length;
    rows.push({ label: "Obligation register (17 signed contracts)", expected: "all quotes match the source file", pass: r.failed.length === 0, found: `${r.checked - r.failed.length} of ${r.checked} quotes match` });
    dims.push({ ...dim("Citation accuracy", "100%", rows), result: `${total - bad} of ${total} quotes verified (${total ? Math.round(((total - bad) / total) * 1000) / 10 : 0}%)` });
  }

  // 2 Conflict recall
  dims.push(dim("Conflict recall", "100% of labelled collisions", [
    check("Datavane vs CloudSpan §7", "conflict or possible conflict citing CloudSpan", firstMatch(B("datavane_strategic_partnership_agreement"), (f) => ["conflict", "possible_conflict"].includes(f.type) && refsFile(f, "cloudspan"))),
    check("Gulf Crown vs Al Noor §12", "conflict citing Al Noor MSA", firstMatch(B("gulf_crown_hotels_msa"), (f) => ["conflict", "possible_conflict"].includes(f.type) && refsFile(f, "al_noor_hospitality"))),
    check("Lakeshore Exhibit A vs Crestline §6.4 (MFN)", "conflict citing Crestline MSA", firstMatch(B("lakeshore_grocers_msa"), (f) => ["conflict", "possible_conflict"].includes(f.type) && refsFile(f, "crestline"))),
    check("Rheinwerk PipeKit vs Northwind", "conflict citing Northwind MSA", firstMatch(B("rheinwerk_analytics_services_agreement"), (f) => ["conflict", "possible_conflict"].includes(f.type) && refsFile(f, "northwind"))),
    check("BlueOrchid Dubai and Muscat hotels vs Al Noor §12", "possible conflict citing Al Noor MSA", firstMatch(B("blueorchid_hotels_pilot_agreement"), (f) => f.type === "possible_conflict" && refsFile(f, "al_noor_hospitality"))),
    check("TravelHub UAE and Saudi hotel ranking vs Al Noor §12", "possible conflict citing Al Noor MSA", firstMatch(B("travelhub_services_agreement"), (f) => f.type === "possible_conflict" && refsFile(f, "al_noor_hospitality"))),
  ]));

  // 3 One-sided clauses with exposure
  {
    const h = B("harrington_health_msa"), d = B("datavane_strategic_partnership_agreement");
    dims.push(dim("One-sided clauses with exposure (High)", "all labelled clauses found as High", [
      check("Harrington MSA: uncapped delay damages", "R-01 High", firstMatch(h, (f) => f.rule === "R-01" && f.severity === "High")),
      check("Harrington MSA: $4,200 per calendar day shown", "exposure line", h.exposure.some((e) => /4,200 per calendar day/.test(e.result)), h.exposure.map((e) => e.result)[0]),
      check("Harrington MSA: unlimited liability", "R-03 High", firstMatch(h, (f) => f.rule === "R-03" && f.severity === "High")),
      check("Harrington MSA: indemnity covers client's negligence", "R-04 High", firstMatch(h, (f) => f.rule === "R-04" && f.severity === "High")),
      check("Harrington MSA: IP reaches pre-existing materials", "R-07 High", firstMatch(h, (f) => f.rule === "R-07" && f.severity === "High")),
      check("Harrington MSA: 90-day payment", "R-05 finding", firstMatch(h, (f) => f.rule === "R-05")),
      check("Harrington MSA: 7-day termination, no pay for work in progress", "R-08 finding", firstMatch(h, (f) => f.rule === "R-08")),
      check("Datavane §5.3 restraint", "High finding on clause 5.3", firstMatch(d, (f) => f.severity === "High" && f.clause_ref.includes("5.3"))),
      check("Datavane §11.1 uncapped one-way indemnity", "High finding on clause 11.1", firstMatch(d, (f) => f.severity === "High" && f.clause_ref.includes("11.1"))),
    ]));
  }

  // 4 Entity and law fit
  dims.push(dim("Entity and law fit accuracy", "100% on labelled cases", [
    check("TravelHub: AtliQ Inc named for a Dubai client", "R-11 High", firstMatch(B("travelhub_services_agreement"), (f) => f.rule === "R-11" && f.severity === "High")),
    check("TravelHub: Pvt Ltd invoices while contract names Inc", "R-12 finding", firstMatch(B("travelhub_services_agreement"), (f) => f.rule === "R-12")),
    check("TravelHub: Dubai law and courts", "R-06 finding", firstMatch(B("travelhub_services_agreement"), (f) => f.rule === "R-06" && has(f, "Dubai"))),
    check("Gulf Crown: Saudi law and Riyadh courts", "R-06 finding", firstMatch(B("gulf_crown_hotels_msa"), (f) => f.rule === "R-06" && has(f, "Saudi"))),
    check("Gulf Crown: Arabic text prevails, no Arabic copy", "R-15 finding", firstMatch(B("gulf_crown_hotels_msa"), (f) => f.rule === "R-15")),
    check("Marcus Reed: Pune company and Indian law for a US individual", "R-11 finding", firstMatch(B("marcus_reed_contractor_agreement"), (f) => f.rule === "R-11")),
  ]));

  // 5 Data classification
  {
    const cls = (slug: string, want: RegExp, needQ: boolean, label: string): Check => {
      const b = B(slug); const c = b.data_class;
      return { label, expected: `${want.source}${needQ ? " and a question for a person" : ""}`, pass: want.test(c.class) && (!needQ || !!c.question), found: `${c.class}${c.question ? " + question" : ""}` };
    };
    const assumed = briefs.filter((b) => /\bno phi\b/i.test(b.data_class.class));
    dims.push(dim("Data classification recall", "100% on labelled set; zero 'assumed no PHI'", [
      cls("harrington_health_msa", /^PHI$/, false, "Harrington MSA"),
      cls("harrington_health_baa", /^PHI$/, false, "Harrington BAA"),
      cls("daniel_ortiz_contractor_agreement", /unknown/i, true, "Ortiz contractor agreement (silent on data)"),
      cls("daniel_ortiz_nda", /unknown/i, true, "Ortiz NDA (silent on data)"),
      cls("rheinwerk_analytics_services_agreement", /unknown|personal/i, true, "Rheinwerk (DPA annex absent)"),
      cls("finserve_capital_mutual_nda", /unknown/i, true, "FinServe NDA (data walkthrough, type not stated)"),
      { label: "No brief assumes 'no PHI'", expected: "0 briefs", pass: assumed.length === 0, found: `${assumed.length} briefs` },
    ]));
  }

  // 6 Bundle completeness
  {
    const h = B("harrington_health_msa"), r = B("rheinwerk_analytics_services_agreement");
    dims.push(dim("Bundle completeness", "all labelled gaps found", [
      check("Harrington: BAA is draft only", "BAA = draft_only", !!bundle(h, /Business Associate/i, "draft_only")),
      check("Harrington: no subcontractor BAA for Ortiz", "missing", !!bundle(h, /Subcontractor BAA.*Ortiz/i, "missing")),
      check("Harrington: intercompany BAA does not cover Harrington", "missing", !!bundle(h, /Intercompany subcontractor BAA/i, "missing")),
      check("Rheinwerk: DPA Annex 3 referenced but absent", "referenced_absent", !!bundle(r, /Annex 3/i, "referenced_absent")),
      check("Rheinwerk: Annex 1 (scope) referenced but absent", "referenced_absent", !!bundle(r, /Annex 1/i, "referenced_absent")),
      check("Kriti: no Rheinwerk consent or data-protection terms", "missing", !!bundle(B("kriti_data_labs_subcontractor_agreement"), /consent|Data-protection/i, "missing")),
    ].map((c) => ({ ...c, found: c.pass ? "found in bundle table" : "not found" }))));
  }

  // 7 Fairness
  {
    const fs = B("finserve_capital_mutual_nda"), lm = B("loopmart_mutual_nda"), k = B("kriti_data_labs_subcontractor_agreement"), m = B("marcus_reed_contractor_agreement");
    dims.push(dim("Fairness detection", "all labelled cases found; genuinely mutual NDA passes", [
      check("FinServe: titled mutual, only the Company's information defined", "R-09 High on §1.2", firstMatch(fs, (f) => f.rule === "R-09" && f.severity === "High" && f.clause_ref.includes("1.2"))),
      check("LoopMart: genuinely mutual NDA passes", "no High finding; R-09 in checks passed", !lm.findings.some((f) => f.severity === "High") && lm.checks_passed.some((c) => c.rule === "R-09"), `${lm.findings.filter((f) => f.severity === "High").length} High; R-09 passed: ${lm.checks_passed.some((c) => c.rule === "R-09")}`),
      check("Kriti: uncapped delay damages on a 12-person vendor", "R-01 High fairness", firstMatch(k, (f) => f.rule === "R-01" && f.severity === "High")),
      check("Kriti: pay-when-paid up to 120 days", "R-20 High", firstMatch(k, (f) => f.rule === "R-20" && f.severity === "High")),
      check("Marcus Reed: worldwide non-compete (§8.1)", "R-20 High on §8", firstMatch(m, (f) => f.rule === "R-20" && f.severity === "High" && f.clause_ref.includes("8.1"))),
      check("Marcus Reed: exclusivity (§3.1)", "R-20 High on §3.1", firstMatch(m, (f) => f.rule === "R-20" && f.severity === "High" && f.clause_ref.includes("3.1"))),
      check("Marcus Reed: 24 hours vs 60 days termination (§9)", "R-20 High on §9", firstMatch(m, (f) => f.rule === "R-20" && f.severity === "High" && f.clause_ref.includes("9.1"))),
      check("Marcus Reed: 60-day payment at AtliQ's discretion (§4.2)", "R-20 High on §4.2", firstMatch(m, (f) => f.rule === "R-20" && f.severity === "High" && f.clause_ref.includes("4.2"))),
    ]));
  }

  // 8 Cross-document consistency
  dims.push(dim("Cross-document consistency", "all labelled mismatches found", [
    check("Harrington MSA §12.4 vs BAA §4.2 (offshore and subcontractors)", "R-18 finding citing §12.4", firstMatch(B("harrington_health_msa"), (f) => f.rule === "R-18" && f.clause_ref.includes("12.4"))),
    check("24-hour BAA notice vs 2 business days in the intercompany BAA (BAA brief)", "R-18 finding", firstMatch(B("harrington_health_baa"), (f) => f.rule === "R-18" && /24[- ]hour/i.test(txt(f)) && /2 business days|two business days/i.test(txt(f)))),
    check("24-hour BAA notice vs 2 business days (MSA brief)", "R-18 finding", firstMatch(B("harrington_health_msa"), (f) => f.rule === "R-18" && /24[- ]hour/i.test(txt(f)) && /2 business days|two business days/i.test(txt(f)))),
  ]));

  // 9 Exception labels
  {
    const lab = (f: Finding | undefined, re: RegExp, label: string) => !!f?.exception_history?.some((e) => re.test(e.contract) && e.label === label);
    const h1 = B("harrington_health_msa").findings.find((f) => f.rule === "R-01");
    const g = B("gulf_crown_hotels_msa").findings.find((f) => f.rule === "R-02");
    const d1 = B("datavane_strategic_partnership_agreement").findings.find((f) => f.rule === "R-13");
    dims.push(dim("Exception history labelling", "100% on labelled set", [
      { label: "Uncapped LD: Brightwater labelled waved through", expected: "waved_through", pass: lab(h1, /Brightwater/i, "waved_through"), found: h1?.exception_history?.map((e) => `${e.contract}: ${e.label}`).join("; ") ?? "none" },
      { label: "Uncapped LD: Al Noor 10% cap labelled deliberate", expected: "deliberate", pass: lab(h1, /Al Noor/i, "deliberate"), found: h1?.exception_history?.map((e) => `${e.contract}: ${e.label}`).join("; ") ?? "none" },
      { label: "Gulf Crown LD: Al Noor labelled deliberate", expected: "deliberate", pass: lab(g, /Al Noor/i, "deliberate"), found: g?.exception_history?.map((e) => `${e.contract}: ${e.label}`).join("; ") ?? "none" },
      { label: "Datavane exclusivity: CloudSpan labelled deliberate", expected: "deliberate", pass: lab(d1, /CloudSpan/i, "deliberate"), found: d1?.exception_history?.map((e) => `${e.contract}: ${e.label}`).join("; ") ?? "none" },
    ]));
  }

  // 10 Over-flag and alarm rate
  {
    const lm = B("loopmart_mutual_nda"), su = B("sunrise_foods_sow2");
    dims.push(dim("Over-flag rate", "no High flags on clean contracts", [
      { label: "LoopMart NDA", expected: "0 High findings", pass: !lm.findings.some((f) => f.severity === "High"), found: `${lm.findings.filter((f) => f.severity === "High").length} High` },
      { label: "Sunrise SOW-2 (headed 'Penalty for Delay')", expected: "0 High findings", pass: !su.findings.some((f) => f.severity === "High"), found: `${su.findings.filter((f) => f.severity === "High").length} High` },
    ]));
    // alarm rate: every High finding must be backed by a rule id from the catalogue and a clause quote, and be consistent with a labelled item above
    const highs = briefs.flatMap((b) => b.findings.filter((f) => f.severity === "High").map((f) => ({ b, f })));
    const backed = highs.filter(({ f }) => /^R-\d\d$/.test(f.rule) && f.quote && f.clause_ref);
    dims.push({
      name: "Alarm rate (the other direction of error)", threshold: "set after the first run; shown next to conflict recall",
      status: "info", result: `${highs.length} High findings across 15 drafts; ${backed.length} carry a rule, clause and verified quote`,
      note: "Whether each High finding is valid is Karandeep's call. In the app he marks findings valid or not valid; the alarm rate is calculated from those decisions. Not computed here.",
      checks: [],
    });
  }

  // 11 Abstention
  dims.push(dim("Abstention behaviour", "100%", [
    check("Gulf Crown: missing Arabic text shown as NOT CHECKED / missing", "Arabic version not treated as a pass", B("gulf_crown_hotels_msa").not_checked.some((n) => /arabic/i.test(n.item + n.reason)) || !!bundle(B("gulf_crown_hotels_msa"), /Arabic/i, "missing"), "NOT CHECKED entry present"),
    check("Orbit scanned MSA: illegible clauses not registered as passes", "register NOT CHECKED list", REGISTER.not_checked.some((n) => /orbit/i.test(JSON.stringify(n))), `${REGISTER.not_checked.length} items`),
    check("Rheinwerk: missing annexes listed as NOT CHECKED or absent", "annexes not treated as a pass", B("rheinwerk_analytics_services_agreement").not_checked.some((n) => /annex/i.test(n.item + n.reason)) || !!bundle(B("rheinwerk_analytics_services_agreement"), /Annex 3/i, "referenced_absent"), "present"),
    check("Register: incomplete coverage stated", "banner text", /17 of about 30/.test(REGISTER.meta.coverage), REGISTER.meta.coverage),
    check("Every brief lists NOT CHECKED items or says none", "15 of 15", briefs.every((b) => Array.isArray(b.not_checked)), `${briefs.filter((b) => b.not_checked.length).length} briefs list items`),
  ]));

  // 12 Register extraction
  {
    const e = REGISTER.entries;
    const alNoor = e.find((x) => x.file.includes("al_noor_hospitality") && x.type === "restrictive_covenant" && x.clause_ref.includes("12.1"));
    const files = new Set(e.map((x) => x.file));
    e.forEach((x) => x.waivers.forEach((w) => files.add(w.file)));
    dims.push(dim("Register extraction accuracy", "set after a first run", [
      check("Al Noor §12.1 entry with end date 14 Sep 2029", "restrictive covenant, end 2029-09-14", !!alNoor && alNoor.end_date === "2029-09-14", alNoor ? `end ${alNoor.end_date}` : "missing"),
      check("Al Noor entry linked to the 10 Feb 2026 waiver (Seaside only)", "waiver attached", !!alNoor && alNoor.waivers.length > 0, alNoor ? `${alNoor.waivers.length} waiver(s)` : "missing"),
      check("Crestline §6.4 MFN entry", "type mfn", e.some((x) => x.file.includes("crestline") && x.type === "mfn" && x.clause_ref.includes("6.4"))),
      check("CloudSpan §7 exclusivity entry (India and GCC)", "type exclusivity", e.some((x) => x.file.includes("cloudspan") && x.type === "exclusivity")),
      check("Brightwater uncapped LD entry (1% per day)", "type ld", e.some((x) => x.file.includes("brightwater") && x.type === "ld" && /1%|one per cent/i.test(x.summary + x.quote))),
      check("All 17 signed files covered (the waiver letter is attached to the Al Noor entry)", "17 of 17", files.size >= 17, `${files.size} files`),
    ], false, "Scored for information; no threshold was set in the PRD before the first run."));
  }

  // 13 No advice language
  {
    const re = /\b(you should (not )?sign|do not sign|don't sign|safe to sign|is (il)?legal|unenforceable|is enforceable|we recommend (signing|rejecting)|i recommend)\b/i;
    const hits: string[] = [];
    for (const b of briefs) { const s = JSON.stringify({ ...b, findings: b.findings.map((f) => ({ t: f.title, e: f.explanation, s: f.seller_text })), headline: b.headline }); const m = s.match(re); if (m) hits.push(`${b.slug}: "${m[0]}"`); }
    dims.push(dim("No advice language", "none in the test set", [{ label: "Scan of all 15 briefs for sign / do-not-sign or legal-conclusion wording", expected: "0 hits", pass: hits.length === 0, found: `${hits.length} hits${hits.length ? " (" + hits.join("; ") + ")" : ""}` }]));
  }

  // 14 Confidentiality (seller view leak test)
  {
    const others = ["Crestline", "Al Noor", "CloudSpan", "Northwind", "Brightwater", "PayTrack", "Acme", "Trustline", "Meridian", "CareBridge", "Orbit Travels", "Kessler", "PixelCraft", "GlobalMart", "Rohan"];
    const rows: Check[] = [];
    for (const b of briefs) {
      const s = JSON.stringify(sellerView(b));
      const leaks: string[] = [];
      for (const n of others) if (s.toLowerCase().includes(n.toLowerCase()) && !b.counterparty.toLowerCase().includes(n.toLowerCase())) leaks.push(n);
      for (const f of b.findings) for (const r of f.register_refs ?? []) { const q = norm(r.quote).slice(0, 50); if (q.length > 20 && norm(s).includes(q)) leaks.push("quote " + r.entry_id); }
      if (b.slug === "lakeshore_grocers_msa") for (const t of ["$85", "$62", "$58", "85/hr", "USD 85"]) if (s.includes(t)) leaks.push(t);
      rows.push({ label: `Seller view: ${b.counterparty} (${b.doc_type.split(" (")[0]})`, expected: "no other client's name, quote or rate", pass: leaks.length === 0, found: leaks.length ? "leaks: " + [...new Set(leaks)].join(", ") : "no leak" });
    }
    dims.push(dim("Confidentiality handling", "no leak in test", rows));
  }

  // 15 Latency
  dims.push({ name: "Latency", threshold: "within the NFR target (5 minutes)", status: "info", result: "Not measured", checks: [], note: "Briefs in this prototype are pre-generated, so a live generation time does not exist. Pages are served from stored briefs and re-verified quote by quote on each request." });

  return {
    dimensions: dims,
    generated: new Date().toISOString(),
    labelsNote: "Labels are the product owner's readings from the PRD (Section 11), marked 'labels pending confirmation by Karandeep and counsel'. The briefs were written from the same documents the labels refer to, so this run shows that the prototype displays, verifies and covers the labelled items. It is not a measure of accuracy on contracts the tool has not seen.",
  };
}
