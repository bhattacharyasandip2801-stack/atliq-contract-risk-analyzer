# AtliQ Contract Risk Analyzer (capstone prototype)

A working prototype for AtliQ's contract reviewer (Karandeep) and its sellers. For each of the 15 incoming contract drafts in the capstone dataset it shows a **ranked brief** in which every finding quotes the contract, says which rule or earlier signed clause it relies on, and ends with a recorded decision. It also holds an **obligation register** built from the 17 signed contracts, a **knowledge base** with cited search over every dataset file, Karandeep's **playbook**, a **check-a-new-draft** screen that runs live rules on pasted text, an **evaluation screen**, a **decision log** and an **audit log**.

**Live app:** https://atliq-contract-risk-analyzer.vercel.app/  ·  **Code:** https://github.com/bhattacharyasandip2801-stack/atliq-contract-risk-analyzer

**To open the prototype:** choose a person on the sign-in page. Choose **Karandeep** to see everything. No password is needed.

Built for Codebasics AI PM Cohort, Capstone 2. Author: Sandip Gopal Bhattacharya. All data is the capstone's synthetic dataset. Nothing here is legal advice.

## Read this first: what is live and what is stored

| Part | How it works in this prototype |
|---|---|
| Briefs for the 15 drafts | **Pre-generated.** They were written from the dataset in a build session with Claude and stored as JSON in `data/briefs/`. The app does **not** call an AI model when you open a brief. |
| Two **simulated** test contracts (`data/dataset/samples/`) | **Pre-generated and stored**, like the 15 briefs. A made-up client MSA (Zephyr Home Retail, INR 96,00,000) and a linked vendor agreement (Tarang Annotation Services) were written on 7 Oct 2026 for live testing; they are **not part of the capstone dataset**. Their briefs are in `data/sample_briefs/` with 99 quotes, each matched word for word to the contract files and to the dataset (checklist, negotiation notes, register, entity sheet). In **Review a new draft**, the reviewer uploads the same file and gets that stored brief; any other text, or an edited copy, gets the rule check only. No model and no key. They never appear in the queue, the evaluation, the playbook or the knowledge base. |
| Quote check | **Live, in code.** Each time a brief page loads, every quote is matched against the source file. A finding whose quote fails is withheld and logged. |
| Exposure figures | Written into the stored briefs with the arithmetic shown (for example 2% x $210,000 = $4,200 per day). |
| Redaction (seller view) | **Live, in code**, on the server. The seller view is rebuilt from redaction-safe fields only. |
| Decision and audit logs | Live, but kept in the **browser's local storage** only. |
| Evaluation screen | Live, in code, over the stored briefs and register. No model is called, so it shows 0 tokens. |
| Review a **new** draft (paste or upload) | **Live, in code, no AI.** Fixed rules from Karandeep's checklist and the entity sheet read the pasted text on the server and quote it back exactly. The text is not stored. It always lists what it could not check. Real patient or personal data stops the check. |
| Knowledge base search | **Live, in code, no AI.** BM25 keyword search over 821 passages from the 40 dataset files. Every passage is copied word for word and re-checked against its file. Reviewer only. |
| Optional AI answer over the knowledge base | **Off by default.** Needs three settings in Vercel (see below). It writes a short answer only from passages the search found, and every quote it cites is checked word for word. An invented quote, advice wording or a malformed reply is withheld. **The live call to a real provider has not been tested**; the code path was tested against stand-in servers using the Anthropic, Gemini and OpenAI request formats. |
| Analysis of a **full brief for a new contract** | **Not built.** Writing a full ranked brief with cross-document checks needs a paid AI API key, which this project does not have. The PRD (Appendix B) describes the design. The paste-a-draft rule check above is the live part. |

## Run it locally

Needs Node.js 20 or newer.

```bash
npm install
npm run dev        # http://localhost:3000
# or
npm run build && npm start
```

No environment variables are needed. There is no database and no API key.

### Optional: switch on the AI answer layer

The knowledge base works without this. To add the optional **Write a short answer** button, set these in Vercel (Project, Settings, Environment Variables), or in a local `.env.local` file that is never committed. Never put a key in the code or in a chat.

| Name | Value |
|---|---|
| `KB_AI_PROVIDER` | `gemini`, `anthropic` or `openai` |
| `KB_AI_KEY` | your key from that provider (a free tier is enough for a demo) |
| `KB_AI_MODEL` | a model name from the provider's own list. No default is built in, so the code never guesses one |
| `KB_AI_BASE_URL` | optional, for a proxy or a test server |

About 6 passages (about 2,500 tokens) go to the model per question. The answer is limited to 10 questions an hour per person and 100 a day, as a best-effort brake per server instance. The live call has not been tested against a real provider from this workspace. After you set the three variables, open the Knowledge base, search, press **Write a short answer**, and confirm that it shows quotes. If it shows an error, the cited passages still work.

Useful scripts:

```bash
npm run validate     # checks every quote in the register and briefs against data/dataset (886 quotes)
npm run build:data   # rebuilds data/briefs.json, data/sources.json and data/tracker.json after editing a brief
npm run lint
```

## Deploy to Vercel (free Hobby plan)

1. Push this folder to a GitHub repository.
2. In Vercel choose **Add New, Project**, import the repository and keep the defaults (Framework: Next.js).
3. Click **Deploy**. No environment variables are required.
4. Open the URL. Check `/api/health` returns `"status":"ok"`.

## Finding labels

Findings keep three levels in the data and are shown with action wording: **High = Decide before signing**, **Medium = Negotiate**, **Low = For your information**. The Evaluation page still uses High, Medium and Low in its case descriptions.

## Value-relative liability check (added 10 Oct 2026)

Karandeep's answer (10 Oct): each contract is judged fresh, sometimes against its value; a 12-month contract at $2k a month with a $500k liability is “a deal in bad faith”. **Review a new draft** now reads a fixed-amount liability cap (symbols or codes for $, ₹, €, £; thousands commas; million, lakh, crore, k) and divides it by the contract value you enter, or the monthly fee times months. The bands are **proposed starting points, not AtliQ policy**: up to 1x no finding; over 1x to 3x For your information; over 3x to 10x Negotiate; over 10x Decide before signing. If the cap is not a fixed amount, the value is missing, or the currencies differ, the result is NOT CHECKED and no exchange rate is guessed. Example: $500,000 on $24,000 is about 20.8x. Six constructed cases are run on the Evaluation page. The stored briefs for the 15 drafts and the two simulated contracts were not re-written for this check.

## Screens

The sidebar groups the screens as **Work** (Contract Dashboard, Review a new draft, Findings worklist, Decisions), **Reference** (Knowledge base, Playbook, Obligation register) and **Quality and Audit** (Evaluation, Audit log). Due dates show Overdue, Due today or Due in N days, counted from today in India; set `DEMO_AS_OF=YYYY-MM-DD` to pin the date for a demo. The look follows the AtliQ website (navy and violet palette, Inter Tight type).

| Screen | What it shows |
|---|---|
| **Contract Dashboard** (`/`, was “Queue”) | Five tiles, each stating its unit and linking to the evidence behind it (drafts to review, “Decide before signing” findings, “Negotiate” findings, drafts needing a decision, register coverage). **Top priorities**: the three earliest-due drafts with something to decide, each with a one-line headline and an Overdue or due-soon label. **All drafts**: counterparty, document, AtliQ entity, due date from the tracker and meeting notes, what the draft needs and decision progress, a coloured **Open** button on each row, with a search box (counterparty, document type or tracker ID), filters by what it needs and by AtliQ entity, sorting by due date, counterparty or most to decide, and 10 drafts per page with Previous/Next (the pager shows only above 10 drafts). Filters and page are kept in the address, so a link reopens the same view. Findings by action and the deadline list sit in a collapsed **Timeline and totals** section. Progress is read from this browser, so it is not a filter. |
| **Findings worklist** (`/findings?level=High` or `Medium`, reviewer only) | Every finding behind the dashboard numbers, in deadline order, each linking to its card in the brief, with the decision status read from this browser. The dashboard tiles link here (41 Decide before signing, 43 Negotiate), to the filtered drafts list and to the register. Every inner page has a “Back to dashboard” link at the top. |
| **Brief** (`/brief/<slug>`) | Header and plain-English headline; exposure table; “Decide before signing” and “Negotiate” findings with the draft quote beside the signed clause it collides with; earlier similar clauses labelled deliberate, waved through or unlabelled; documents the deal needs (signed, draft only, missing, referenced but absent); data type (asks a question when the contract is silent); NOT CHECKED list; checks that passed; decision buttons; a box that refuses to sign, send, negotiate or give legal advice; print to A4 PDF. |
| **Review a new draft** (`/intake`) | Paste text, upload a .txt or .md file, or pick a draft from the dataset. Returns findings with exact quotes from your text, the delay-damages amount per day and the liability cap as a multiple of the contract value when you give a value (or a monthly fee and months), the entity and country fit, what AtliQ has already signed that may be touched (Karandeep's view only), a data-type question, NOT CHECKED, and the list of checks that ran. Sellers see flags and questions without other clients' terms. |
| **Decide in 5 minutes** (top of every reviewer brief) | All findings on one screen with level, clause and decision status, and an optional timer. Press **Start timer** when you begin; the clock counts only while the brief is open and visible, and stops when every “Decide before signing” finding has a recorded decision made after the start. Target: under 5 minutes (the client's stated threshold). Times are kept in the browser and listed on the Evaluation screen. Below it, the findings are shown one at a time: tabs for **Decide before signing** and **Negotiate**, a numbered strip of findings with a tick when decided, Previous/Next buttons, and automatic move to the next undecided finding after a decision. Print shows every finding. Decision buttons are colour-coded: green Accept, amber Negotiate, red Reject, violet Override. **Print or save as PDF** is the dark button in the side panel. |
| **Knowledge base** (`/knowledge`) | A strip of counts, a search box, 12 topic tiles (each runs a search, so what it shows always comes from the files), suggested questions, your recent searches (kept only in your browser) and a library of all 40 documents grouped by type. Results show the exact passages; **Read in context** opens the full document beside them with the passage highlighted, and **Copy citation** copies the source. A "Terms in plain English" panel gives 17 short definitions. **Those definitions are general information written for this prototype, not taken from AtliQ's files, and not legal advice**; each has a button to find the term in the files. Karandeep's view only. |
| **Playbook** (`/playbook`) | Karandeep's nine checklist rules and which drafts hit each, the exceptions on record labelled deliberate or waved through, the 16 past negotiations as written, and the entity rules. Karandeep's view only. |
| **Register** (`/register`) | Obligations from the 17 signed contracts, with the banner "17 of about 30 signed contracts", the Al Noor waiver attached to the clause it modifies, and a CSV export of every restrictive covenant, exclusivity and most-favoured-customer term for counsel. |
| **Decisions** | Every decision with who, when and why. An override needs a reason. |
| **Evaluation** | The metrics from PRD Section 11 against their thresholds, with expected and found for each case. |
| **Audit log** | Every view, export, print, decision, refused request, sign-in and sign-out, with the person who did it. |
| **User demo** (sidebar, or top strip on a phone) | A 12-step guided tour for new users: dashboard, a brief, a clash with a signed contract, recording a decision, the register, reviewing a new draft, the knowledge base, the playbook, the evaluation, the decision log, the seller view and a close. The tour signs you in as Karandeep, then as Jay for the seller step, then back as Karandeep. Press Esc or the close button to leave it. |
| **Sign-in** (first page) | A demo sign-in with five people from the PRD and the tracker: Karandeep (full access) and the sellers Dhaval, Jay, Bhavin and Pranav. Each seller sees only the drafts they requested in the tracker's `requested_by` column, in the limited view: flag types, severity, missing documents and "Ask Karandeep", with other clients' commercial terms and clause quotes hidden. There is no password, and the cookie is not signed, so this is **not security**. Production would use company single sign-on. |

## How the stored data was built

1. **Register** (`data/register.json`, 149 entries): every restrictive covenant, exclusivity, most-favoured-customer term, IP promise, delay-damages, liability, payment, law, insurance and data term from the 17 signed files, each with an exact quote, dates where the text allows, whether Affiliates are bound, and an exception label taken only from `negotiation_notes.md` and the Brightwater post-mortem. The Orbit Travels scan is partly illegible; unreadable clauses are listed as NOT CHECKED, not registered.
2. **Briefs** (`data/briefs/*.json`): one per draft, written against the rule catalogue (PRD Appendix A, rules R-01 to R-21), the register, Karandeep's checklist, the entity sheet, the tracker and the meeting notes.
3. **Quote rule** (`scripts/validate-quotes.mjs`, `lib/validate.ts`): markdown emphasis marks are removed and whitespace is collapsed; after that the quote must appear **exactly** in the source file. No other change is allowed.
4. **Leak test**: the evaluation screen scans each seller view for other clients' names, rates and register quotes. It found one leak while building (a vendor's name in a seller question), which was fixed.

### What was added to the dataset

No contract was changed. The four meeting-note files were copied from the project's documents into `data/dataset/meeting_notes/`. Added files: `data/register.json`, `data/briefs/`, and the generated `data/briefs.json`, `data/sources.json`, `data/tracker.json`.

## Evaluation: what it proves and what it does not

- The labelled cases come from PRD Section 11 and are marked **pending confirmation by Karandeep and counsel**.
- The briefs were written from the same documents the labels refer to. So a pass shows that the prototype displays, verifies and covers the labelled items. It is **not** a measure of accuracy on contracts the tool has not seen, and there is no train/test split because nothing is trained.
- Quote accuracy is the one check that does not depend on anyone's judgement: it is a string match against the file.
- The alarm rate (share of High findings that are valid) can only come from Karandeep's review, so it is not computed.
- Latency is not measured for briefs, because they are stored. The paste-a-draft check runs in well under a second on the dataset drafts.
- The **live rule check** has 19 labelled cases. The rules were tuned on the same 15 drafts, so a pass shows coverage of those cases, not accuracy on contracts the tool has not seen. Its limits: it matches wording only (so it can miss a clause worded differently and can flag a clause that only looks similar), it reads plain text only (a PDF, Word file or scan is NOT CHECKED), and it cannot compare documents against each other, for example the Harrington BAA against the MSA.

## Findings that differ from what people assumed

- **BlueOrchid** is not "just India hotels": 3 of the 12 hotels in its Annexure B are in Dubai and Muscat.
- **Gulf Crown §9.1(d)** is a warranty by AtliQ that no agreement restricts it, not a restriction. The restriction comes from Al Noor §12.
- **TravelHub** also reaches the UAE and Saudi hotel market, which is a possible conflict with Al Noor §12, for counsel.
- **Rheinwerk**: the draft does not assign PipeKit to the client. The collision is AtliQ's warranty that it solely owns PipeKit, which the signed Northwind contract appears to have assigned.
- **Sunrise SOW-2** and the **LoopMart NDA** have no High finding. Sunrise cannot be fully compared with "last time" because SOW-1 and the proposal are not on file.

## Known limitations

- Briefs are a reading of clause text by an AI model in a build session and have not been reviewed by Karandeep or counsel. They are not legal conclusions; collisions that depend on interpretation are labelled "possible conflict, for counsel".
- The register covers 17 of about 30 signed contracts. "Absent" means absent from those 17 files.
- Missing files are shown as NOT CHECKED: Gulf Crown's Arabic text, Rheinwerk Annexes 1 and 3, Harrington Exhibits A to C, Northwind Schedules 2 and 3, the Seaside SOW, Sunrise SOW-1.
- The Harrington briefs mention a sample extract of apparently real patient data. That comes from the 27 Sep huddle note, is shown as "reported, not confirmed", and no such data is in this repository.
- Sign-in is a demo: pick a person, no password, and the cookie is not signed, so anyone could set it by hand. It shows role-based access (PRD FR-17); it does not secure anything. Decisions and the audit log live in one browser.
- The tracker value of the Kriti agreement ($10,100) is not reconciled with its INR fee because the sources give no exchange rate.

- The quick rule check in **Review a new draft** is narrower than the stored briefs. On the two simulated contracts it finds payment, indemnity wording, termination and the data-agreement point, but it does **not** find the 24-month conflict-of-interest bar or the delay indemnity "howsoever caused", and it marks 60- and 90-day payment High where the spec rule R-05 says Medium. The screen says so and shows the stored brief first.
- Masking of confidential clauses before text goes to an AI provider was raised in the client meeting and is **not built**: the app calls no AI provider.

## Examiner API (read-only, JSON)

The API uses the same sign-in. `GET /api/health` is open. For the others, sign in first, for example:

```bash
curl -c jar.txt -X POST https://<your-site>/api/signin -H 'content-type: application/json' -d '{"user":"karandeep"}'
curl -b jar.txt https://<your-site>/api/briefs
```

Without a sign-in the API answers 401. A seller gets only their own drafts, in the redacted view, and 403 on the register and evaluation.


| Endpoint | Returns |
|---|---|
| `GET /api/health` | Status and counts |
| `GET /api/briefs` | The 15 drafts with highest severity |
| `GET /api/briefs/<slug>` | One brief with the number of quotes verified. Add `?role=seller` for the redacted seller view |
| `GET /api/register` | The full register (403 for `?role=seller`) |
| `GET /api/register/export` | CSV for counsel |
| `GET /api/eval` | The evaluation run |

Slugs: `harrington_health_msa`, `harrington_health_baa`, `daniel_ortiz_contractor_agreement`, `daniel_ortiz_nda`, `marcus_reed_contractor_agreement`, `gulf_crown_hotels_msa`, `travelhub_services_agreement`, `blueorchid_hotels_pilot_agreement`, `lakeshore_grocers_msa`, `rheinwerk_analytics_services_agreement`, `datavane_strategic_partnership_agreement`, `finserve_capital_mutual_nda`, `loopmart_mutual_nda`, `kriti_data_labs_subcontractor_agreement`, `sunrise_foods_sow2`.

## Cost and token use

The running app makes no model calls, so it costs nothing to run on Vercel's free plan. The Cost Estimation sheet describes the cost of live analysis, which this prototype does not include; its figures are estimates until live analysis is built and measured.

## Project layout

```
app/            screens and API routes (Next.js App Router)
components/     brief views, decision panel, ask box, sign-in
lib/            data loading, quote validation, seller redaction, evaluation, browser store
data/           register.json, briefs/, sample_briefs/ (simulated), generated bundles, dataset/ (the capstone files; samples/ is simulated)
scripts/        validate-quotes.mjs, build-data.mjs
spec/           the shared rules used to write the register and briefs
```
