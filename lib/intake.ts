// Live rule checks for a draft that is pasted or uploaded. No AI model is called and nothing leaves the server.
// Each rule is a fixed pattern from Karandeep's checklist or the entity sheet. A finding quotes the pasted text exactly.
// A clean result never says "safe": it lists the checks that ran and the ones that could not.
import { REGISTER } from "./data";
import type { RegisterEntry } from "./types";

export type Geography = "" | "US" | "India" | "Middle East" | "Europe" | "Other" | "n/a";
export interface IntakeInput { text: string; counterparty?: string; geography?: Geography; value?: number | null; currency?: string }
export type Sev = "High" | "Medium" | "Low";
export interface IntakeFinding {
  id: string; severity: Sev; type: "clause_risk" | "entity_law" | "possible_conflict" | "fairness" | "bundle" | "data_class" | "consistency";
  title: string; clause_ref: string; quote: string; explanation: string; rule: string; ask: string;
  /** Signed clauses AtliQ has already agreed that may be touched. Reviewer view only. */
  register?: { entry_id: string; contract: string; clause_ref: string; quote: string; label: string | null }[];
}
export interface CheckLine { check: string; status: "ran" | "not_checked"; result: string }
export interface IntakeResult {
  stop: { reason: string } | null;
  findings: IntakeFinding[];
  checks: CheckLine[];
  notChecked: { item: string; reason: string }[];
  dataClass: { cls: string; basis: string; question: string | null };
  exposure: { label: string; calculation: string; result: string }[];
  chars: number;
  summary: string;
}

const MAX_CHARS = 250_000;
const sentenceAt = (t: string, i: number, max = 420) => {
  let s = i, e = i;
  const stop = (k: number) => t[k] === "\n" || (t[k] === "." && (k + 1 >= t.length || /\s/.test(t[k + 1])));
  while (s > 0 && !stop(s - 1)) s--;
  while (e < t.length && !stop(e)) e++;
  if (e < t.length && t[e] === ".") e++;
  let out = t.slice(s, e);
  const lead = out.length - out.trimStart().length;
  out = out.trim();
  if (out.length > max) { const rel = i - s - lead; const a = Math.max(0, rel - max / 2); out = out.slice(a, a + max); }
  return out;
};
/** Nearest clause label above a position, such as "11.2" or "ARTICLE 11". */
function clauseRef(t: string, i: number): string {
  if (i < 600) return "opening of the draft";
  const before = t.slice(0, i).split("\n");
  for (let n = before.length - 1; n >= 0 && n > before.length - 60; n--) {
    const m = /^\s*(?:#+\s*)?(?:\*\*)?\s*((?:ARTICLE|Article|SECTION|Section|Clause)\s+\d+|\d+(?:\.\d+){0,2}\.?(?=\s))/.exec(before[n]);
    if (m) return m[1].replace(/\.$/, "").replace(/^(\d)/, "§$1");
  }
  return "clause number not found";
}
/** Reads the first money amount in a sentence: symbol or code before or after, thousands commas (also Indian), million, lakh, crore, k. */
function parseAmount(sent: string): { symbol: string; value: number } | null {
  const SYM: Record<string, string> = { "$": "$", "us$": "$", usd: "$", "₹": "₹", inr: "₹", rs: "₹", "rs.": "₹", "€": "€", eur: "€", "£": "£", gbp: "£" };
  const MUL: Record<string, number> = { million: 1e6, m: 1e6, lakh: 1e5, lakhs: 1e5, crore: 1e7, crores: 1e7, k: 1e3, thousand: 1e3 };
  const pre = /(US\$|\$|USD|₹|INR|Rs\.?|€|EUR|£|GBP)\s?(\d[\d,]*(?:\.\d+)?)\s*(million|lakhs?|crores?|thousand|k|m)?\b/i.exec(sent);
  const post = /(\d[\d,]*(?:\.\d+)?)\s*(million|lakhs?|crores?|thousand|k|m)?\s*(USD|INR|EUR|GBP|dollars)\b/i.exec(sent);
  const pick = pre && (!post || pre.index <= post.index) ? { sym: pre[1], n: pre[2], mul: pre[3] } : post ? { sym: post[3], n: post[1], mul: post[2] } : null;
  if (!pick) return null;
  const symbol = pick.sym.toLowerCase() === "dollars" ? "$" : SYM[pick.sym.toLowerCase()];
  const base = Number(pick.n.replace(/,/g, ""));
  if (!symbol || !Number.isFinite(base)) return null;
  return { symbol, value: base * (pick.mul ? MUL[pick.mul.toLowerCase()] : 1) };
}
const find = (t: string, re: RegExp) => { const m = re.exec(t); return m ? { i: m.index, m } : null; };
const num = (s: string) => Number(s.replace(/,/g, ""));
const WORDNUM: Record<string, number> = { one: 1, two: 2, three: 3, five: 5, seven: 7, ten: 10, fifteen: 15, thirty: 30, sixty: 60, ninety: 90, "twenty-four": 24, "twenty four": 24, forty: 40, "forty-five": 45, "forty five": 45, "one hundred twenty": 120 };
const toN = (s: string) => (/^\d/.test(s) ? num(s) : WORDNUM[s.toLowerCase()] ?? NaN);

const regEntries = (types: string[]) => REGISTER.entries.filter((e) => types.includes(e.type));
const regRef = (e: RegisterEntry) => ({ entry_id: e.id, contract: e.contract, clause_ref: e.clause_ref, quote: e.quote, label: e.exception_label });

const US_STATES = "Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming|United States";
const LAWS: [RegExp, string][] = [
  [/india|mumbai|pune|maharashtra/i, "India"], [/england|english|united kingdom|\buk\b|london/i, "England and Wales"],
  [/difc|dubai|emirates|\buae\b|abu dhabi/i, "UAE"], [/saudi|\bksa\b/i, "Saudi Arabia"], [/singapore/i, "Singapore"], [/german/i, "Germany"],
  [new RegExp(`\\b(?:${US_STATES})\\b`, "i"), "United States"],
];
/** The country named first in the sentence, so "Illinois law, arbitration in Singapore" reads as Illinois. */
function lawCountry(s: string): string {
  let best = "", at = Infinity;
  for (const [re, name] of LAWS) { const m = re.exec(s); if (m && m.index < at) { at = m.index; best = name; } }
  return best;
}

export function runIntake(input: IntakeInput, opts: { reviewer: boolean }): IntakeResult {
  const text = (input.text ?? "").slice(0, MAX_CHARS).replace(/\*/g, "");
  const geo = input.geography ?? "";
  const findings: IntakeFinding[] = [];
  const checks: CheckLine[] = [];
  const notChecked: { item: string; reason: string }[] = [];
  const exposure: IntakeResult["exposure"] = [];
  let n = 0;
  const add = (f: Omit<IntakeFinding, "id">) => { findings.push({ id: `I-${String(++n).padStart(2, "0")}`, ...f }); };
  const done = (check: string, result: string, status: CheckLine["status"] = "ran") => checks.push({ check, status, result });

  const empty = (summary: string, stop: IntakeResult["stop"] = null): IntakeResult => ({
    stop, findings: [], checks, notChecked, dataClass: { cls: "Not read", basis: summary, question: null }, exposure, chars: text.length, summary,
  });
  if (text.trim().length < 200) {
    notChecked.push({ item: "The whole draft", reason: "Fewer than 200 characters of text were provided, so nothing meaningful could be read." });
    return empty("Not enough text to check.");
  }

  // 0. Real personal or patient data: stop, never analyse.
  const ssn = find(text, /\b\d{3}-\d{2}-\d{4}\b/);
  const dob = find(text, /\b(?:DOB|date of birth)\b[^\n]{0,24}\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}/i);
  const icd = find(text, /\b[A-TV-Z]\d{2}\.\d{1,3}\b/);
  const mrn = find(text, /\bMRN\b/);
  const signals = [ssn, dob, icd, mrn].filter(Boolean).length;
  if (ssn || signals >= 2) {
    done("Real data check", "STOPPED: the text looks like real personal or patient records.");
    return empty("Stopped. The text contains what looks like real patient or personal records (for example a government ID number, a date of birth, a diagnosis code or a medical record number). This tool reads contracts only. Do not proceed with this file. Tell Karandeep.", { reason: "Real data detected" });
  }
  done("Real data check", "No government ID, date of birth plus diagnosis code, or medical record number pattern found.");

  const isNda = /non-?disclosure|confidentiality\s+agreement|\bNDA\b/i.test(text.slice(0, 1800));
  const isSow = !isNda && /statement\s+of\s+work|\bSOW\b/i.test(text.slice(0, 800));
  const childDoc = isNda || isSow;

  // 1. Entity and country
  const incRe = /AtliQ\s+Inc\b\.?/i, pvtRe = /AtliQ\s+Technologies\s+(?:Pvt\.?\s*Ltd\.?|Private\s+Limited)/i;
  const inc = find(text, incRe), pvt = find(text, pvtRe);
  const first2k = text.slice(0, 2500);
  const partyEntity = ((): "Inc" | "Pvt Ltd" | "" => {
    const a = incRe.exec(first2k), b = pvtRe.exec(first2k);
    if (a && (!b || a.index < b.index)) return "Inc";
    if (b) return "Pvt Ltd";
    return "";
  })();
  if (!inc && !pvt) {
    done("Entity fit", "NOT CHECKED: no AtliQ entity is named in the text.", "not_checked");
    notChecked.push({ item: "Which AtliQ entity signs", reason: "Neither AtliQ Inc nor AtliQ Technologies Pvt Ltd is named in the pasted text." });
  } else if (!geo || geo === "n/a") {
    done("Entity fit", `NOT CHECKED against a client country (${geo === "n/a" ? "this is not a client contract" : "none given"}). Entity in the parties clause: ${partyEntity || "unclear"}.`, "not_checked");
    notChecked.push({ item: "Entity against the client's country", reason: geo === "n/a" ? "Not a client contract (agency, freelancer or partner), so the client-country rule does not apply. AtliQ Inc serves US clients only; AtliQ Technologies Pvt Ltd serves everyone else (atliq_entities.md)." : "No client country was selected. AtliQ Inc serves US clients only; AtliQ Technologies Pvt Ltd serves everyone else (atliq_entities.md)." });
  } else {
    const expected = geo === "US" ? "Inc" : "Pvt Ltd";
    if (partyEntity && partyEntity !== expected) {
      const at = partyEntity === "Inc" ? inc! : pvt!;
      add({
        severity: "High", type: "entity_law", title: `Draft names AtliQ ${partyEntity === "Inc" ? "Inc (US only)" : "Technologies Pvt Ltd"} for a ${geo} client`,
        clause_ref: clauseRef(text, at.i), quote: sentenceAt(text, at.i),
        explanation: `The entity sheet says AtliQ Inc serves clients in the United States only, and AtliQ Technologies Pvt Ltd serves clients in India, the Middle East, Europe and anywhere else outside the US. You selected ${geo}, which points to ${expected === "Inc" ? "AtliQ Inc" : "AtliQ Technologies Pvt Ltd"}, but the parties clause names ${partyEntity === "Inc" ? "AtliQ Inc" : "AtliQ Technologies Pvt Ltd"}.`,
        rule: "Entity sheet: who serves whom", ask: "Confirm with Karandeep which AtliQ entity should sign before this goes further.",
      });
      done("Entity fit", `Mismatch: ${partyEntity} named for a ${geo} client.`);
    } else done("Entity fit", `${partyEntity || "Entity"} fits ${geo}.`);
    if (inc && pvt) {
      const inv = find(text, /invoice[sd]?\b[^.\n]{0,160}AtliQ\s+(?:Inc|Technologies)/i) ?? find(text, /AtliQ\s+(?:Inc|Technologies[^.\n]{0,30})[^.\n]{0,160}invoice/i);
      if (inv) {
        const sentence = sentenceAt(text, inv.i);
        const invEntity = /AtliQ\s+Technologies/i.test(sentence) && !/AtliQ\s+Inc/i.test(sentence) ? "Pvt Ltd" : /AtliQ\s+Inc/i.test(sentence) && !/AtliQ\s+Technologies/i.test(sentence) ? "Inc" : "";
        if (invEntity && partyEntity && invEntity !== partyEntity) {
          add({
            severity: "High", type: "entity_law", title: `Contract is with AtliQ ${partyEntity}, but invoices come from AtliQ ${invEntity}`, clause_ref: clauseRef(text, inv.i), quote: sentence,
            explanation: "The text names one AtliQ entity as the contracting party and a different one as the invoicing party. Finance notes in the entity sheet say a contracting-versus-invoicing mismatch caused payment delays twice in 2025.",
            rule: "Entity sheet: finance notes", ask: "Ask Karandeep and finance which entity should contract and which should invoice.",
          });
        }
      }
    }
  }

  // 2. Governing law
  const law = find(text, /governed\s+by|construed\s+in\s+accordance\s+with\s+the\s+laws?/i) ?? find(text, /governing\s+law/i);
  if (!law) {
    done("Governing law", "NOT CHECKED: no governing-law sentence was found.", "not_checked");
    notChecked.push({ item: "Governing law and courts", reason: "No governing-law sentence matched the patterns this tool reads." });
  } else {
    const lawSentence = sentenceAt(text, law.i, 600);
    const lc = lawCountry(lawSentence);
    const want = partyEntity === "Inc" ? "United States" : partyEntity === "Pvt Ltd" ? "India" : "";
    if (want && lc && lc !== want) {
      add({
        severity: "Medium", type: "entity_law", title: `Governing law is ${lc}; AtliQ ${partyEntity} would normally sit under ${want} law`, clause_ref: clauseRef(text, law.i), quote: sentenceAt(text, law.i),
        explanation: `Karandeep's checklist says "gov law → ours (India for Pvt Ltd, US for Inc)". This draft puts AtliQ ${partyEntity} under ${lc} law. Karandeep has accepted other laws before (for example English law at Northwind), so this is a decision to take, not an automatic no.`,
        rule: "Checklist: governing law", ask: "Decide whether to accept this law or counter with AtliQ's own.",
      });
      done("Governing law", `${lc} law; checklist expects ${want}.`);
    } else if (!lc) { done("Governing law", "A governing-law sentence was found but its country could not be read.", "not_checked"); notChecked.push({ item: "Governing law", reason: "The law named could not be mapped to a country by this tool." }); }
    else done("Governing law", want ? `${lc} law matches the entity.` : `${lc} law found; the entity was not clear, so it was not compared.`);
  }
  const lang = find(text, /\b(Arabic|German|French|Spanish|Hindi)\b[^.\n]{0,80}\bprevail/i) ?? find(text, /\bprevail[^.\n]{0,80}\b(Arabic|German|French|Spanish|Hindi)\b/i);
  if (lang) {
    add({
      severity: "Medium", type: "entity_law", title: "Another language version prevails over the English text", clause_ref: clauseRef(text, lang.i), quote: sentenceAt(text, lang.i),
      explanation: "If a non-English version prevails and only the English draft is in the file, the binding text has not been read.", rule: "Not checked: other-language text", ask: "Ask the other side for the prevailing-language text before signing.",
    });
    notChecked.push({ item: "Prevailing-language text", reason: "The draft says another language prevails; only the English text was provided." });
    done("Language", "Another language prevails; that text was not provided.", "not_checked");
  } else done("Language", "No language-prevails clause found.");

  // 3. Delay damages
  const ldRe = /liquidated\s+damages|penalty\s+for\s+delay|delay\s+(?:damages|penalt)/gi;
  const RATE = /(\d+(?:\.\d+)?)\s*(?:%|per\s?cent|percent)[^.\n]{0,160}?\b(?:per|each|every)\s+(?:calendar\s+|business\s+|working\s+)?(day|week)/i;
  const CAP = /(?:shall\s+not\s+exceed|not\s+to\s+exceed|maximum\s+of|capped\s+at|cap\s+of|up\s+to\s+a\s+maximum|aggregate\s+of)[^.\n]{0,100}?(\d+(?:\.\d+)?)\s*(?:%|per\s?cent|percent)/i;
  let ldAny = false, ldHit: { base: number; rate: RegExpExecArray; region: string } | null = null;
  for (let lm: RegExpExecArray | null; (lm = ldRe.exec(text)); ) {
    ldAny = true;
    const base = Math.max(0, lm.index - 200), region = text.slice(base, lm.index + 1200), rate = RATE.exec(region);
    if (rate) { ldHit = { base, rate, region }; break; }
  }
  if (!ldAny) done("Delay damages", "No delay-damages clause found.");
  else if (!ldHit) {
    done("Delay damages", "NOT CHECKED: a delay-damages clause exists but its rate could not be read.", "not_checked");
    notChecked.push({ item: "Delay-damages rate and cap", reason: "A clause was found but its percentage and period could not be read by this tool." });
  } else {
    const { rate, region } = ldHit, cap = CAP.exec(region);
    {
      const rIdx = ldHit.base + rate.index;
      const pct = Number(rate[1]), unit = rate[2].toLowerCase();
      const base = /(?:total\s+)?contract\s+value|total\s+(?:contract\s+)?(?:fees|price|value)|entire\s+(?:contract|fees)/i.test(rate[0]) ? "whole" : /milestone/i.test(rate[0]) ? "milestone" : "unclear";
      const ref = clauseRef(text, rIdx);
      const quote = sentenceAt(text, rIdx);
      if (base === "whole" && input.value && input.value > 0) {
        const perUnit = (pct / 100) * input.value, cur = input.currency || "";
        const perDay = unit === "day" ? perUnit : perUnit / 7, perWeek = unit === "week" ? perUnit : perUnit * 7;
        exposure.push({ label: "Delay damages", calculation: `${pct}% x ${cur}${input.value.toLocaleString("en-US")} = ${cur}${perUnit.toLocaleString("en-US", { maximumFractionDigits: 2 })} per ${unit}`, result: `${cur}${perDay.toLocaleString("en-US", { maximumFractionDigits: 0 })} a day, ${cur}${perWeek.toLocaleString("en-US", { maximumFractionDigits: 0 })} a week${cap ? ` (capped at ${cap[1]}%)` : " (no cap found)"}` });
      }
      if (!cap) {
        add({
          severity: "High", type: "clause_risk", title: `Delay damages of ${pct}% per ${unit}${base === "whole" ? " of the whole contract value" : ""}, no cap found`, clause_ref: ref, quote,
          explanation: `Checklist: "LDs → cap it. never open ended". The clause charges ${pct}% per ${unit} and no cap sentence was found near it.${exposure.length ? ` With the value you gave: ${exposure[exposure.length - 1].result}.` : base === "whole" ? " Enter the contract value to see the amount per day." : ""} This tool only matches wording, so check the surrounding clauses for a cap placed elsewhere.`,
          rule: "Checklist: delay damages", ask: "Counter with a cap (past deals: 5% of the milestone fee) or decide to accept, with a reason.",
        });
        done("Delay damages", `${pct}% per ${unit}, no cap found.`);
      } else {
        const cp = Number(cap[1]);
        if (cp > 5) {
          add({
            severity: "Medium", type: "clause_risk", title: `Delay damages capped at ${cp}%, above the 5% positions in the negotiation notes`, clause_ref: ref, quote,
            explanation: `A cap exists (${cp}%). The negotiation notes record Karandeep's counters of "max 5% of that milestone fee" at Acme, Northwind and Trustline, and a 10% cap accepted at Al Noor as "a strategic exception for Al Noor only — not our new standard".`,
            rule: "Checklist: delay damages; negotiation notes", ask: "Decide whether this cap is acceptable or counter at 5%.",
          });
          done("Delay damages", `${pct}% per ${unit}, capped at ${cp}% (above 5%).`);
        } else done("Delay damages", `${pct}% per ${unit}, capped at ${cp}%. Within the checklist.`);
      }
    }
  }

  // 4. Liability
  const unl = find(text, /unlimited\s+liabilit|without\s+limitation\s+(?:for|of|as\s+to)[^.\n]{0,60}(?:liabilit|damages)|no\s+(?:limit|cap)\s+(?:on|to)\s+(?:its\s+|the\s+)?liabilit|liabilit[^.\n]{0,60}(?:shall\s+be\s+unlimited|is\s+unlimited)|uncapped\s+liabilit|nothing\s+in\s+this\s+agreement\s+shall\s+limit\s+or\s+exclude[^.\n]{0,80}liabilit/i);
  const hasCap = find(text, /(?:aggregate\s+|total\s+|maximum\s+)?liabilit[^.\n]{0,140}(?:shall\s+not\s+exceed|limited\s+to|capped|in\s+no\s+event\s+exceed)/i);
  if (unl) {
    add({
      severity: "High", type: "clause_risk", title: "Unlimited liability", clause_ref: clauseRef(text, unl.i), quote: sentenceAt(text, unl.i),
      explanation: 'Checklist: "liability → 1x fees. NOT unlimited". The negotiation notes record Karandeep walking away from a €120k deal over "without limitation for all damages" (Kessler Mobility).', rule: "Checklist: liability", ask: "Counter with a cap at one times the fees, or decide to accept, with a reason.",
    });
    done("Liability", "Unlimited liability wording found.");
  } else if (!hasCap) {
    add({
      severity: childDoc ? "Low" : "Medium", type: "clause_risk", title: childDoc ? "No limit on liability in this document (it may sit in the master agreement)" : "No limit on liability found", clause_ref: "whole draft", quote: text.slice(0, 160).trim(),
      explanation: `No sentence limiting liability was found. Checklist: "liability → 1x fees". ${childDoc ? "NDAs and SOWs often leave this to the master agreement, so check that one. " : ""}Silence in the text is not the same as no cap elsewhere.`, rule: "Checklist: liability", ask: "Ask whether a limitation-of-liability clause is missing.",
    });
    done("Liability", "No cap sentence found.");
  } else done("Liability", "A liability cap sentence was found (whether it is equal for both sides was not checked).");
  // 4b. Liability cap against contract value (client, 10 Oct: "a 12 month contract worth $2k/month with a liability of $500k is a deal in bad faith").
  // The multiple bands are proposed starting points, not a recorded AtliQ policy. Currency must match or the check says NOT CHECKED.
  if (hasCap) {
    const sent = sentenceAt(text, hasCap.i, 700);
    const amt = parseAmount(sent);
    if (!amt) {
      done("Liability against contract value", "The cap is not a fixed amount (for example a multiple of fees), so no comparison with the contract value was made.");
    } else if (!input.value || input.value <= 0) {
      done("Liability against contract value", `NOT CHECKED: the cap is ${amt.symbol}${amt.value.toLocaleString("en-US")} but no contract value was entered.`, "not_checked");
      notChecked.push({ item: "Liability cap against contract value", reason: "Enter the contract value (or monthly fee and months) to compare it with the cap." });
    } else if (!input.currency || amt.symbol !== input.currency) {
      done("Liability against contract value", `NOT CHECKED: the cap is in ${amt.symbol} but the value was entered in ${input.currency || "no currency"}. No conversion is guessed.`, "not_checked");
      notChecked.push({ item: "Liability cap against contract value", reason: "The cap and the contract value are in different currencies; no exchange rate is assumed." });
    } else {
      const mult = amt.value / input.value, m1 = Math.round(mult * 10) / 10;
      const calc = `${amt.symbol}${amt.value.toLocaleString("en-US")} cap / ${amt.symbol}${input.value.toLocaleString("en-US")} contract value`;
      exposure.push({ label: "Liability cap against contract value", calculation: calc, result: `${m1}x the contract value` });
      const sev: Sev | null = mult > 10 ? "High" : mult > 3 ? "Medium" : mult > 1 ? "Low" : null;
      if (sev) {
        add({
          severity: sev, type: "clause_risk", title: `Liability cap is about ${m1} times the contract value`, clause_ref: clauseRef(text, hasCap.i), quote: sent,
          explanation: `${calc} = ${m1}x. Karandeep's test (10 Oct): the liability should be judged against what the contract is worth, for example a 12 month contract at $2k a month with a $500k liability is "a deal in bad faith". Bands used here are proposed starting points (over 1x for information, over 3x negotiate, over 10x decide before signing), not AtliQ policy.`,
          rule: "Client answer 10 Oct: judged against contract value (bands proposed)", ask: "Counter with a cap in line with the contract value (one times the fees is the checklist reference), or decide to accept, with a reason.",
        });
        done("Liability against contract value", `${m1}x the contract value.`);
      } else done("Liability against contract value", `${m1}x the contract value; not above the contract value.`);
    }
  }
  notChecked.push({ item: "Whether the liability cap and indemnity apply equally to both sides", reason: "This tool matches wording only and does not decide who each sentence binds." });

  // 5. Indemnity
  const ind = find(text, /regardless\s+of\s+whether[^.\n]{0,160}negligence\s+of\s+(?:any|the)\s+[A-Z]\w*/) ?? find(text, /indemnif[^.\n]{0,240}?(?:arising\s+(?:from|out\s+of)|including|resulting\s+from|caused\s+by|regardless\s+of)[^.\n]{0,100}?(?:negligence|gross\s+negligence|wilful|act\s+or\s+omission)[^.\n]{0,60}(?:of\s+(?:the\s+)?)?(?:Client|Customer|Company|Harrington|Indemnitee)/i);
  const mutualInd = find(text, /each\s+party\s+(?:shall|will|agrees\s+to)\s+(?:defend\s+and\s+)?indemnif|mutual\s+indemn/i);
  const anyInd = find(text, /\bindemnif/i);
  if (ind && !mutualInd) {
    add({
      severity: "High", type: "clause_risk", title: "Indemnity covers the other side's own negligence", clause_ref: clauseRef(text, ind.i), quote: sentenceAt(text, ind.i),
      explanation: 'Checklist: "indemnity → mutual. we don\'t cover their mistakes". At PayTrack Karandeep wrote "we can\'t insure against PayTrack\'s own negligence" and got a mutual indemnity.', rule: "Checklist: indemnity", ask: "Counter with a mutual indemnity, or decide to accept, with a reason.",
    });
    done("Indemnity", "One-way indemnity that reaches the other side's own negligence.");
  } else if (anyInd && !mutualInd) {
    const m = anyInd;
    add({
      severity: "Medium", type: "clause_risk", title: "Indemnity does not read as mutual", clause_ref: clauseRef(text, m.i), quote: sentenceAt(text, m.i),
      explanation: 'No "each party shall indemnify" wording was found. Checklist: "indemnity → mutual".', rule: "Checklist: indemnity", ask: "Check who indemnifies whom and ask for a mutual clause if it is one-way.",
    });
    done("Indemnity", "An indemnity exists; no mutual wording found.");
  } else done("Indemnity", anyInd ? "Mutual indemnity wording found." : "No indemnity clause found.");

  // 6. Payment
  const pay: { days: number; i: number }[] = [];
  const payRes = [/(?:payable|payment|pay|paid|invoice)[^.\n]{0,160}?within\s+(?:(\w[\w -]*?)\s*\()?(\d{1,3})\)?\s*(?:calendar\s+|business\s+)?days/gi, /\bnet\s+(\d{2,3})\b/gi, /(\d{2,3})\s*(?:calendar\s+|business\s+)?days\s+(?:after|from|of)\s+(?:the\s+)?(?:receipt|date)\s+of\s+(?:the\s+|an\s+|each\s+)?invoice/gi, /payment\s+terms?[^.\n]{0,30}?(\d{2,3})\s*days/gi];
  for (const re of payRes) { let m: RegExpExecArray | null; while ((m = re.exec(text))) { const d = Number(m[m.length - 1] && /^\d+$/.test(m[m.length - 1]) ? m[m.length - 1] : m[2] ?? m[1]); if (d >= 7 && d <= 365) pay.push({ days: d, i: m.index }); } }
  const worst = pay.sort((a, b) => b.days - a.days)[0];
  if (!worst) { done("Payment terms", "NOT CHECKED: no payment period in days was found.", "not_checked"); notChecked.push({ item: "Payment period", reason: "No sentence giving a payment period in days matched." }); }
  else if (worst.days > 45) {
    add({
      severity: "High", type: "clause_risk", title: `Payment in ${worst.days} days, above the checklist maximum of 45`, clause_ref: clauseRef(text, worst.i), quote: sentenceAt(text, worst.i),
      explanation: `Checklist: "payment → 30 days, 45 max". This text allows ${worst.days}. If AtliQ is the one paying (its own paper for an agency or freelancer), the same rule applies in reverse: AtliQ should not pay late to a small vendor what it would reject as a supplier.`, rule: "Checklist: payment", ask: "Counter at 30 days (45 at most), or decide to accept, with a reason.",
    });
    done("Payment terms", `${worst.days} days; checklist maximum is 45.`);
  } else done("Payment terms", `${worst.days} days; within the checklist (30, 45 at most).`);
  const pwp = find(text, /pay[- ]when[- ]paid|paid[- ]when[- ]paid|after\s+(?:Contractor|Company|AtliQ)\s+(?:has\s+)?receiv(?:es|ed)\s+(?:the\s+)?payment\s+from/i);
  if (pwp) {
    add({
      severity: "Medium", type: "clause_risk", title: "Payment depends on AtliQ being paid first", clause_ref: clauseRef(text, pwp.i), quote: sentenceAt(text, pwp.i),
      explanation: "A pay-when-paid term pushes the client's payment risk onto the vendor. Karandeep says he does not want his own paper to be the thing he hates receiving (PixelCraft).", rule: "Fairness: AtliQ's own paper", ask: "If this is AtliQ's own template, remove it or set a fixed payment date.",
    });
  }

  // 7. Termination
  const TERM = [/terminat[^.\n]{0,200}?\b(\d{1,3}|seven|twenty[- ]four|thirty|sixty|ninety)\s*(?:\(\d+\)\s*)?(hours?|days?)\b[^.\n]{0,40}(?:notice|written)/gi, /(\d{1,3}|seven|twenty[- ]four)\s*(?:\(\d+\)\s*)?(hours?|days?)['’]?\s+(?:prior\s+)?(?:written\s+)?notice[^.\n]{0,80}terminat/gi];
  let termSeen = false, termFlag = false;
  for (const re of TERM) {
    for (let tm: RegExpExecArray | null; (tm = re.exec(text)); ) {
      termSeen = true;
      const val = toN(tm[1]), unit = /hour/i.test(tm[2]) ? "hours" : "days";
      const win = text.slice(Math.max(0, tm.index - 100), tm.index + 800);
      const cause = /for\s+cause|material(?:ly)?\s+breach|cure/i.test(tm[0]);
      const short = !cause && (unit === "hours" || (Number.isFinite(val) && val <= 7));
      const noPay = !cause && /without\s+(?:any\s+)?(?:payment|compensation|liability)|no\s+(?:payment|compensation)\s+(?:shall\s+be\s+)?(?:due|payable|owed)|not\s+be\s+entitled\s+to\s+(?:any\s+)?(?:payment|compensation)|no\s+obligation\s+to\s+pay\s+for\s+work\s+in\s+progress/i.test(win);
      if (short || noPay) {
        add({
          severity: "Medium", type: "clause_risk", title: `Termination on ${tm[1]} ${unit} notice${noPay ? " with no payment for work in progress" : ""}`, clause_ref: clauseRef(text, tm.index), quote: sentenceAt(text, tm.index),
          explanation: 'Checklist: "termination → they pay for work done". A very short notice period, or no payment for work in progress, moves cost onto the party being terminated.', rule: "Checklist: termination", ask: "Check who can terminate, on what notice, and whether work done is paid.",
        });
        termFlag = true; break;
      }
    }
    if (termFlag) break;
  }
  done("Termination", termFlag ? "Short notice or no payment for work in progress." : termSeen ? "Notice periods found; none short enough to flag." : "No notice period for termination found.");

  // 8. IP
  const ip = find(text, /(?:pre-?existing|background)\s+(?:materials|ip|intellectual)[^.\n]{0,300}?(?:assigns?|transfers?|conveys?)[^.\n]{0,100}right,?\s+title/i) ?? find(text, /(?:assign|transfer)[^.\n]{0,160}(?:all\s+)?(?:right|title|interest|intellectual\s+property)[^.\n]{0,260}?(?:pre-?existing|background|licensed|proprietary\s+tools|methodolog|frameworks|know-how)/i);
  if (ip) {
    add({
      severity: "Medium", type: "clause_risk", title: "IP assignment reaches AtliQ's pre-existing tools", clause_ref: clauseRef(text, ip.i), quote: sentenceAt(text, ip.i),
      explanation: 'Checklist: "IP → client owns what we build for them, we keep our own stuff". The text assigns more than what is built for this client. In 2025 an IP clause was skimmed at Northwind and later surfaced as a collision (PipeKit).', rule: "Checklist: IP", ask: "Carve out AtliQ's pre-existing and reusable tools, or decide to accept, with a reason.",
    });
    done("IP", "Assignment wording that reaches pre-existing material.");
  } else done("IP", "No assignment of pre-existing material found.");

  // 9. Promises already made: restrictive covenants, exclusivity, MFN, no-restriction warranties, regions
  const warrant = find(text, /\b(?:it\s+is\s+)?not\s+bound\s+by\s+any\s+(?:agreement|restriction|contract)[^.\n]{0,120}(?:prevent|restrict)/i) ?? find(text, /(?:represents?|warrants?|certif)[^.\n]{0,160}?\b(?:not|no)\b[^.\n]{0,100}?(?:bound|restriction|restrict|exclusiv|non-?compet|conflict)/i);
  const nonCompete = find(text, /non-?compet|shall\s+not\s+(?:directly\s+or\s+indirectly\s+)?(?:provide|engage|perform|work)[^.\n]{0,120}(?:competitor|competing)/i);
  const excl = ((): { i: number; m: RegExpExecArray } | null => {
    const re = /\bexclusiv(?:e|ely|ity)\b/gi;
    for (let m: RegExpExecArray | null; (m = re.exec(text)); ) {
      const w = text.slice(Math.max(0, m.index - 40), m.index + 110);
      if (/non-?\s*$/i.test(text.slice(Math.max(0, m.index - 6), m.index))) continue;
      if (/exclusive\s+of|jurisdiction|remed|propert|licen[cs]|courts?\b|venue|ownership|right\s+(?:of|to)\s+use|sole\s+and\s+exclusive\s+(?:remedy|liability)|exclusively\s+for/i.test(w)) continue;
      return { i: m.index, m };
    }
    return null;
  })();
  const mfn = find(text, /most[- ]favou?red|no\s+less\s+favou?rable/i);
  const noHire = find(text, /non-?solicit|no-?hire|shall\s+not\s+(?:solicit|hire)/i);
  const gulf = find(text, /\b(?:Saudi|KSA|UAE|Dubai|Abu\s+Dhabi|Oman|Muscat|Qatar|Kuwait|Bahrain|GCC|Gulf|Riyadh|Jeddah)\b/);
  const hosp = find(text, /\b(?:hotel|hospitality|resort|travel)s?\b/i);
  const platformPartner = find(text, /(?:implementation|reseller|referral|channel|alliance|technology)\s+partner[^.\n]{0,200}platform|platform[^.\n]{0,200}(?:implementation|reseller|referral|channel)\s+partner/i);
  const rates = find(text, /\$\s?\d+(?:\.\d+)?\s*(?:\/|per)\s*(?:hr|hour)|rate\s+card/i);
  const counsel = regEntries(["restrictive_covenant", "exclusivity", "mfn"]);
  const pick = (f: (e: RegisterEntry) => boolean) => counsel.filter(f).map(regRef);
  const attach = (arr: ReturnType<typeof regRef>[]) => (opts.reviewer ? { register: arr } : {});
  let covenantFlag = false;
  if (warrant) {
    covenantFlag = true;
    add({
      severity: "High", type: "possible_conflict", title: "Draft asks AtliQ to warrant that no signed restriction binds it", clause_ref: clauseRef(text, warrant.i), quote: sentenceAt(text, warrant.i),
      explanation: "A warranty that AtliQ is bound by no restriction can be false if an earlier contract binds AtliQ or its Affiliates. The register lists the restrictive covenants, exclusivity and most-favoured-customer terms AtliQ has already signed. Whether any applies here is for Karandeep and counsel. This is a possible conflict, not a legal conclusion.",
      rule: "Register: what AtliQ has already promised", ask: opts.reviewer ? "Compare each register entry below with this clause. Counsel decides scope." : "Ask Karandeep. This clause needs a check against what AtliQ has already signed.", ...attach(counsel.map(regRef)),
    });
  }
  if (gulf && hosp) {
    covenantFlag = true;
    const entries = pick((e) => /al noor/i.test(e.counterparty) && e.type === "restrictive_covenant");
    add({
      severity: "High", type: "possible_conflict", title: "Gulf-region hospitality work: check against the signed Al Noor restriction", clause_ref: clauseRef(text, gulf.i), quote: sentenceAt(text, gulf.i),
      explanation: "The text mentions a Gulf-region place and hospitality or travel. The register holds a signed restriction on analytics and AI services to Gulf-region hospitality businesses. Whether it reaches this deal, and whether the Seaside-only waiver helps, is for counsel to confirm. This is a possible conflict, not a legal conclusion.",
      rule: "Register: Al Noor restrictive covenant", ask: opts.reviewer ? "Compare the register entry with this deal's scope. Send both texts to counsel." : "Ask Karandeep. This deal needs a check against an earlier signed restriction.", ...attach(entries),
    });
  }
  if (platformPartner) {
    covenantFlag = true;
    const entries = pick((e) => /cloudspan/i.test(e.counterparty));
    add({
      severity: "High", type: "possible_conflict", title: "Platform partnership: check against the signed CloudSpan exclusivity", clause_ref: clauseRef(text, platformPartner.i), quote: sentenceAt(text, platformPartner.i),
      explanation: "The text makes AtliQ an implementation, reseller or referral partner for a platform. The register holds a signed exclusivity with CloudSpan about competing platforms. Whether this platform competes is for Karandeep and counsel to confirm. This is a possible conflict, not a legal conclusion.",
      rule: "Register: CloudSpan exclusivity", ask: opts.reviewer ? "Compare the register entry with this platform's business. Send both texts to counsel." : "Ask Karandeep. This deal needs a check against an earlier exclusivity.", ...attach(entries),
    });
  }
  if (rates) {
    const entries = pick((e) => e.type === "mfn");
    add({
      severity: "Medium", type: "possible_conflict", title: "Rates in this draft: check against signed most-favoured-customer terms", clause_ref: clauseRef(text, rates.i), quote: sentenceAt(text, rates.i),
      explanation: "A signed most-favoured-customer clause can be triggered by quoting a lower rate to another customer. Compare these rates with the register entry. This is a possible conflict, not a legal conclusion.",
      rule: "Register: most-favoured-customer", ask: opts.reviewer ? "Compare the rates with the register entry." : "Ask Karandeep. These rates need a check against an earlier signed price promise.", ...attach(entries),
    });
  }
  if (!covenantFlag && (nonCompete || excl || mfn || noHire)) {
    const hit = (nonCompete ?? excl ?? mfn ?? noHire)!;
    add({
      severity: "Medium", type: "clause_risk", title: `Restriction in this draft${nonCompete ? " (non-compete)" : excl ? " (exclusivity)" : mfn ? " (most-favoured customer)" : " (non-solicit or no-hire)"}`, clause_ref: clauseRef(text, hit.i), quote: sentenceAt(text, hit.i),
      explanation: "This clause restricts what AtliQ may do later. It becomes a new entry in what AtliQ has promised, and it should be checked against existing promises.", rule: "Register: what AtliQ has already promised", ask: "Decide whether AtliQ can live with this restriction and add it to the register if signed.",
      ...attach(counsel.map(regRef)),
    });
  }
  done("What AtliQ has already promised", covenantFlag ? "Possible conflicts flagged for counsel." : (nonCompete || excl || mfn || noHire) ? "Restriction wording found; no region or platform trigger." : "No restriction, exclusivity or MFN wording found.");
  notChecked.push({ item: "Collisions with the 13 signed contracts not in the dataset", reason: `The register covers ${REGISTER.meta.coverage}. Silence here does not mean no collision.` });

  const licRaw = find(text, /grants?\s+(?:to\s+)?(?:Client|Customer|the\s+Company)?[^.\n]{0,40}\b(?:perpetual|irrevocable)[^.\n]{0,40}\b(?:perpetual|irrevocable)?[^.\n]{0,200}?(?:right\s+to\s+use|licen[cs]e|right\s+of\s+use)/i);
  const lic = licRaw && /proprietary|accelerator|reusable|toolkit|connectors|templates\b[^.\n]{0,40}libraries/i.test(text.slice(Math.max(0, licRaw.i - 500), licRaw.i + 200)) ? licRaw : null;
  if (lic) {
    add({
      severity: "Medium", type: "possible_conflict", title: "Perpetual, irrevocable rights in AtliQ's own tools: check against signed IP promises", clause_ref: clauseRef(text, lic.i), quote: sentenceAt(text, lic.i),
      explanation: "A perpetual, irrevocable licence of material AtliQ owns can collide with an IP promise already made to another client for the same material. Compare with the register entries below. This is a possible conflict, not a legal conclusion.",
      rule: "Register: IP promises", ask: opts.reviewer ? "Compare the register entries with the tool named in this clause." : "Ask Karandeep. This clause needs a check against earlier IP promises.", ...(opts.reviewer ? { register: regEntries(["ip_promise"]).map(regRef) } : {}),
    });
  }

  // 10. Mutual in name versus mutual in text
  if (isNda) {
    const def = /["“]Confidential\s+Information["”]\s+(?:means|shall\s+mean)([^]{0,500}?)(?:\n\n|\.\s+[A-Z])/i.exec(text);
    const titledMutual = /mutual/i.test(text.slice(0, 600));
    const oneSided = def && /\b(?:the\s+)?Company\b/.test(def[1]) && !/(?:Counterparty|either\s+party|each\s+party|Disclosing\s+Party|the\s+other\s+party|by\s+or\s+on\s+behalf\s+of\s+(?:the\s+)?(?:Recipient|AtliQ))/i.test(def[1]);
    if (oneSided && def) {
      add({
        severity: "High", type: "fairness", title: `${titledMutual ? 'Titled "mutual", but only one side\'s information is defined' : "One-sided NDA: only one side's information is defined"}`, clause_ref: clauseRef(text, def.index), quote: sentenceAt(text, def.index),
        explanation: `Checklist: "NDAs → just sign if mutual". A document called mutual is not mutual if only one party's information is protected. Karandeep's own rule is that AtliQ signs mutual NDAs only ("we'll be sharing our architecture too").`, rule: "Checklist: NDAs; fairness", ask: "Ask for the definition to cover both parties' information.",
      });
      done("Mutual NDA", "Only one side's information is defined.");
    } else done("Mutual NDA", def ? "The definition of confidential information covers both sides." : "NOT CHECKED: the definition of confidential information could not be read.", def ? "ran" : "not_checked");
    const resid = find(text, /\bresidual/i), perp = find(text, /perpetual|in\s+perpetuity|indefinite(?:ly)?|survive[^.\n]{0,60}(?:indefinite|perpetual)/i);
    for (const [hit, label, why] of [[resid, "Residuals clause", "A residuals clause lets the other side use what it remembers from AtliQ's information."], [perp, "Confidentiality with no end date", "A perpetual duty is a long commitment for a company without a legal team to track it."]] as const) {
      if (hit) add({ severity: "Medium", type: "fairness", title: label, clause_ref: clauseRef(text, hit.i), quote: sentenceAt(text, hit.i), explanation: why, rule: "Fairness: NDA", ask: "Ask for it to be removed or limited." });
    }
  } else done("Mutual NDA", "Not an NDA.");

  // 11. Data type and documents
  const phi = find(text, /\b(?:protected\s+health\s+information|PHI|HIPAA|patient|medical\s+record|diagnos[ei]s)\b/i);
  const personal = find(text, /\b(?:personal\s+data|GDPR|data\s+subject|data\s+protection|personally\s+identifiable)\b/i);
  const baaTitled = /business\s+associate\s+agreement/i.test(text.slice(0, 800));
  const baaRef = find(text, /business\s+associate\s+agreement|\bBAA\b/i);
  const dpaRef = find(text, /data\s+processing\s+(?:agreement|addendum)|\bDPA\b/i);
  let dataClass: IntakeResult["dataClass"];
  if (phi) {
    dataClass = { cls: "Health data likely (PHI)", basis: sentenceAt(text, phi.i), question: "Will any real patient data reach AtliQ or its subcontractors, and is a signed BAA in place before it does?" };
    if (!baaTitled && !baaRef) add({ severity: "High", type: "bundle", title: "Health data mentioned, no Business Associate Agreement referenced", clause_ref: clauseRef(text, phi.i), quote: sentenceAt(text, phi.i), explanation: "The text mentions health data but does not mention a BAA. A US healthcare project that touches patient data needs the NDA, a BAA and the services contract, and subcontractors who touch the data need the same duties signed before the data moves.", rule: "Bundle: healthcare needs a BAA", ask: "Check whether a signed BAA and subcontractor flow-down exist before any data is shared." });
    else add({ severity: "Medium", type: "data_class", title: "Health data: confirm the BAA and subcontractor duties are signed before data moves", clause_ref: clauseRef(text, phi.i), quote: sentenceAt(text, phi.i), explanation: "The text mentions health data. Signing the contract does not by itself show that a BAA and subcontractor flow-downs are signed.", rule: "Data type: PHI", ask: "Confirm which documents are signed and who will touch the data." });
    done("Data type and documents", "Health data mentioned.");
  } else if (personal) {
    dataClass = { cls: "Personal data likely", basis: sentenceAt(text, personal.i), question: "Is a signed data-processing agreement in place for this deal?" };
    if (!dpaRef) add({ severity: childDoc ? "Low" : "Medium", type: "bundle", title: "Personal data mentioned, no data-processing agreement referenced", clause_ref: clauseRef(text, personal.i), quote: sentenceAt(text, personal.i), explanation: "A European client with personal data needs a data-processing agreement. None is mentioned in the text.", rule: "Bundle: personal data needs a DPA", ask: "Ask whether a DPA exists and who signs it." });
    done("Data type and documents", "Personal data mentioned.");
  } else {
    dataClass = { cls: "Unknown: the text is silent", basis: "No health-data or personal-data wording was found.", question: "Will this engagement involve patient or personal data? Ask the seller. The tool does not assume there is none." };
    add({ severity: "Low", type: "data_class", title: "Data type unknown: the contract is silent", clause_ref: "whole draft", quote: text.slice(0, 160).trim(), explanation: "Silence is not the same as no data. The tool never assumes that no patient or personal data is involved.", rule: "Data type: ask when silent", ask: dataClass.question! });
    done("Data type and documents", "Silent on data: a question was raised.");
  }
  const refs = new Set<string>(); const re = /\b(Annex|Exhibit|Schedule|Appendix)\s+([A-Z]|\d+)\b/g; let rm: RegExpExecArray | null;
  while ((rm = re.exec(text))) refs.add(`${rm[1]} ${rm[2]}`);
  const missing: string[] = [];
  for (const r of refs) { const [kind, id] = r.split(" "); if (!new RegExp(`^\\s*(?:#+\\s*)?(?:\\*\\*)?${kind}\\s+${id}\\b\\s*(?:[—–:\\-.)(]|\\n|$)`, "im").test(text)) missing.push(r); }
  if (missing.length) {
    const at = find(text, new RegExp(missing[0].replace(" ", "\\s+"), "i"))!;
    add({ severity: "Medium", type: "bundle", title: `Referenced but not in the text: ${missing.slice(0, 5).join(", ")}`, clause_ref: clauseRef(text, at.i), quote: sentenceAt(text, at.i), explanation: "The draft refers to documents or attachments whose text is not in what was pasted. They have not been read.", rule: "Bundle: referenced documents", ask: "Ask the other side for the missing attachments." });
    notChecked.push({ item: `Attachments referenced but absent: ${missing.slice(0, 5).join(", ")}`, reason: "Referenced in the text; no heading with that name was found." });
    done("Referenced attachments", `Absent from the text: ${missing.slice(0, 5).join(", ")}.`, "not_checked");
  } else done("Referenced attachments", refs.size ? "Every attachment named has a heading in the text." : "No attachment is referred to.");

  // Always stated
  notChecked.push({ item: "Anything these patterns cannot read", reason: "This is a rule check, not an AI reading. It finds the wording above only. Other wording, scans, tables and images are not read." });
  const order: Record<Sev, number> = { High: 0, Medium: 1, Low: 2 };
  findings.sort((a, b) => order[a.severity] - order[b.severity]);
  const hi = findings.filter((f) => f.severity === "High").length, me = findings.filter((f) => f.severity === "Medium").length;
  const summary = hi || me
    ? `${hi} to decide before signing and ${me} to negotiate, from the checks that ran. ${notChecked.length} item${notChecked.length === 1 ? "" : "s"} could not be checked.`
    : "Nothing to decide before signing in the checks run. That is not a statement that the draft is safe: see what could not be checked.";
  return { stop: null, findings, checks, notChecked, dataClass, exposure, chars: text.length, summary };
}
