# Data-build spec (shared by all authors of register.json and briefs)

Repo root: /home/claude/atliq-contract-risk-analyzer
Source documents: data/dataset/ (incoming/ = 15 drafts, signed_contracts/ = 17 signed, meeting_notes/, contract_tracker.csv, atliq_entities.md, karandeep_contract_checklist.md, negotiation_notes.md)

## Ground rules (non-negotiable)
1. Every fact must come from the source files. If the text does not say it, do not write it. No invented clauses, numbers, names, dates.
2. Every quote must be copied from the file named in its `file` field. `file` is the path relative to data/dataset/, e.g. `incoming/2026-09-18_gulf_crown_hotels_msa_draft.md`.
   Matching rule (scripts/validate-quotes.mjs): exact string match after removing markdown `*`/`_` emphasis and collapsing whitespace. Quote at most ~400 characters; use one contiguous passage, no "..." joins.
3. Run `node scripts/validate-quotes.mjs <your json file>` and fix every FAIL before you finish. Drop a finding rather than keep an unverified quote.
4. Language: plain English for a CEO who is not a lawyer. Never say "you should sign", "safe to sign", "this is legal/illegal", "enforceable". State what the clause says, what it collides with, what the exposure is, and what a person needs to decide. For possible legal collisions use the label "possible conflict, for counsel".
5. Never write "no PHI". If a contract is silent on what data is involved, set data_class.class = "unknown" and give a question for a person.
6. If something cannot be tested (unreadable text, missing language version, missing annex, incomplete register), put it in `not_checked` with the reason. Never count it as a pass.
7. Numbers: show arithmetic. Exposure per day/week = rate x base the clause names; if the clause has a cap show it; if none say "uncapped".
8. Do not over-flag. A draft that is genuinely fine (LoopMart NDA, Sunrise SOW-2) must have no high-severity finding. Read it honestly; do not manufacture issues. Put minor points in `low`.

## Severity
High = uncapped/unmanaged exposure, breaks an existing promise, or puts protected data at risk (needs a recorded decision).
Medium = outside Karandeep's recorded position, exposure bounded.
Low = inside checklist range or worth knowing.
(NOT CHECKED is separate.)

## Rule catalogue (use these IDs in `rule`)
R-01 LD must have a cap (checklist: "LDs → cap it. never open ended")                         High
R-02 LD above recorded position: 0.5% of affected milestone fee per week, cap 5% of that milestone fee, no LD for client-caused delay (counters at Acme, Northwind, Trustline)   Medium
R-03 Liability must not be unlimited, should not exceed 1x fees ("liability → 1x fees. NOT unlimited")   High
R-04 Indemnity must be mutual; fail if AtliQ covers counterparty's own negligence                   High
R-05 Payment within 30 days, 45 max; >45 fails; pay-when-paid in AtliQ's own paper tested the same   Medium
R-06 Governing law: India for Pvt Ltd, US for Inc. Other law shown with any earlier exception in register (Northwind English law, Al Noor DIFC)   Medium
R-07 IP: client owns what AtliQ builds for it, AtliQ keeps its own. Assignment reaching pre-existing/reusable AtliQ materials fails   High
R-08 Termination: client pays for work done. Termination for convenience without pay for work in progress, or sharply unequal by party, fails   Medium
R-09 NDA mutuality: both parties' information defined and both bound; non-compete/no-hire/residuals clause in an NDA fails   High
R-10 SOW must match proposal and parent MSA on scope, milestones, rates, LD, payment, law   Medium
R-11 Contracting entity must fit client geography: Pvt Ltd outside US, AtliQ Inc for US clients only   High
R-12 Invoicing entity must be the contracting entity   Medium
R-13 Conflict with a register entry: restrictive covenant, exclusivity, MFN or IP promise the draft would breach, or a draft warranty the register contradicts   High
R-14 Possible conflict: scope ambiguous, or register entry binds Affiliates / reaches the other AtliQ entity. Label "possible conflict, for counsel"   High
R-15 Text says another language prevails and no copy in that language on file: NOT CHECKED for the missing part   Medium
R-16 Healthcare/personal data: BAA (or DPA) must be signed before access; subcontractors need approval and flow-down   High
R-17 A document/annex the contract refers to must be present; absent ones listed as missing   Medium
R-18 Documents in one bundle must agree (subcontracting, notice periods, insurance)   Medium
R-19 Insurance required above what AtliQ holds (cyber policy is $1M per the 27 Sep huddle)   Medium
R-20 Fairness to the other side: exclusivity or long non-compete on an individual/small vendor, one-sided termination periods, payment at AtliQ's discretion in AtliQ's own paper   High
R-21 Real personal/patient records found in an uploaded file: stop, say so, log   Stop

## register.json schema
{
 "meta": {"coverage": "17 of about 30 signed contracts", "built_from": "...", "note": "..."},
 "entries": [ {
   "id": "REG-001",
   "contract": "Al Noor Hospitality MSA",
   "counterparty": "Al Noor Hospitality Group",
   "file": "signed_contracts/....md",
   "atliq_entity": "AtliQ Technologies Pvt Ltd" | "AtliQ Inc" | "unclear (text must be checked)",
   "clause_ref": "§12.1",
   "type": "restrictive_covenant|exclusivity|mfn|ip_promise|ld|liability|payment|governing_law|insurance|subcontractor|notice|data|waiver|other",
   "summary": "one plain sentence",
   "quote": "exact text",
   "start_date": "YYYY-MM-DD or null", "end_date": "YYYY-MM-DD or null",
   "dates_note": "how the term runs (e.g. term + 18 months) or null",
   "binds_affiliates": "yes|no|unclear",
   "affiliates_note": "what the Affiliate definition says (quote in extra_quotes if useful)",
   "waivers": [ {"file": "...", "clause_ref": "...", "quote": "...", "limit": "what the waiver covers and does not cover"} ],
   "exception_label": null | "deliberate" | "waved_through" | "unlabelled",
   "exception_note": "evidence for the label from negotiation_notes.md / post-mortem, or null"
 } ]
}
Every contract's restrictive covenants, exclusivity, MFN, IP promises, LD/liability/payment/governing-law/insurance/data terms get an entry. Waiver letters are linked to the clause they modify via `waivers`, not listed alone.
Exception labels: deliberate = a recorded, reasoned decision (e.g. Al Noor 10% LD cap approved by Karandeep as one-off); waved_through = accepted without review (Brightwater signed "from phone", Northwind skimmed IP and boilerplate, Rohan Iyer IP "ok" from phone); unlabelled = no evidence either way.

## brief schema (data/briefs/<slug>.json)

## brief JSON schema (write data/briefs/<slug>.json; slug = draft filename without date prefix and `_draft`, e.g. gulf_crown_hotels_msa)
{
 "slug": "...", "draft_file": "incoming/....md", "tracker_id": "C-025", "counterparty": "...", "doc_type": "...",
 "atliq_entity_in_draft": "...", "client_country": "...", "tracker_status": "...", "deadline": "e.g. 10 Oct 2026 (tracker note / 22 Sep queue)" or null, "value": "e.g. $140,000 (tracker)",
 "headline": "one plain sentence: what the reviewer most needs to know",
 "highest_severity": "High|Medium|Low|None",
 "exposure": [ {"label": "...", "clause_ref": "§12", "calculation": "1% x $140,000 per week", "result": "$1,400 per week", "cap": "read from clause: ... or 'uncapped'", "file": "incoming/...", "quote": "..."} ],
 "findings": [ {
    "id": "F-01", "severity": "High|Medium", "type": "conflict|possible_conflict|clause_risk|entity_law|bundle|consistency|data_class|fairness",
    "title": "short", "clause_ref": "§9.1(d)", "file": "<draft file>", "quote": "exact text from the draft",
    "explanation": "2-4 plain sentences: what it says, why it matters, what is at stake. No advice language.",
    "rule": "R-13",
    "register_refs": [ {"entry_id": "REG-A18", "file": "signed_contracts/...", "clause_ref": "§12.1", "quote": "exact text from the signed file"} ],
    "exception_history": [ {"contract": "Al Noor MSA", "label": "deliberate|waved_through|unlabelled", "note": "..."} ],
    "decision_needed": true,
    "redact_in_seller_view": true|false,
    "seller_text": "generic one-liner safe to show a seller (never another client's rates/terms)"
 } ],
 "bundle": { "needed": [ {"document": "Business Associate Agreement", "status": "signed|draft_only|missing|referenced_absent", "note": "...", "file": "<file where the evidence is>", "quote": "<evidence>" } ] },
 "data_class": { "class": "PHI|de-identified|personal data|none stated|unknown", "basis": "...", "question": "question for a person, or null", "file": "...", "quote": "..." },
 "checks_passed": [ {"rule": "R-09", "note": "what was tested and passed", "file": "...", "quote": "..."} ],
 "not_checked": [ {"item": "...", "reason": "..."} ],
 "low": [ {"title": "...", "clause_ref": "...", "file": "...", "quote": "...", "note": "..."} ],
 "seller_view": { "flag_types": ["conflict","entity_law"], "missing_documents": ["..."], "ask_karandeep": ["..."] },
 "provenance": "Pre-generated from the capstone dataset in a build session. Quotes validated by exact string match."
}
Rules: findings ordered High first. Every finding needs rule, clause_ref, file, quote, and either register_refs or a checklist/entity-sheet basis stated in explanation. Use `exception_history` whenever a similar clause in a signed contract exists (find it in data/register.json). Use REG ids that exist in data/register.json (read it; it has ~150 entries). seller_text must not reveal other clients' commercial terms (rates, LD %, prices); say e.g. "Possible clash with an existing client commitment; ask Karandeep."
Hypotheses given in your task are from earlier reading: verify each in the text. If the text does not support one, do not include it; say so in your final reply.
