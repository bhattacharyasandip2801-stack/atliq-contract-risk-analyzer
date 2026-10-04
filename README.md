# AtliQ Contract Risk Analyzer (capstone prototype)

A working prototype for AtliQ's contract reviewer (Karandeep) and its sellers. For each of the 15 incoming contract drafts in the capstone dataset it shows a **ranked brief** in which every finding quotes the contract, says which rule or earlier signed clause it relies on, and ends with a recorded decision. It also holds an **obligation register** built from the 17 signed contracts, an **evaluation screen**, a **decision log** and an **audit log**.

Built for Codebasics AI PM Cohort, Capstone 2. Author: Sandip Gopal Bhattacharya. All data is the capstone's synthetic dataset. Nothing here is legal advice.

## Read this first: what is live and what is stored

| Part | How it works in this prototype |
|---|---|
| Briefs for the 15 drafts | **Pre-generated.** They were written from the dataset in a build session with Claude and stored as JSON in `data/briefs/`. The app does **not** call an AI model when you open a brief. |
| Quote check | **Live, in code.** Each time a brief page loads, every quote is matched against the source file. A finding whose quote fails is withheld and logged. |
| Exposure figures | Written into the stored briefs with the arithmetic shown (for example 2% x $210,000 = $4,200 per day). |
| Redaction (seller view) | **Live, in code**, on the server. The seller view is rebuilt from redaction-safe fields only. |
| Decision and audit logs | Live, but kept in the **browser's local storage** only. |
| Evaluation screen | Live, in code, over the stored briefs and register. No model is called, so it shows 0 tokens. |
| Analysis of a **new** contract | **Not built.** It needs a paid AI API key, which this project does not have. The PRD (Appendix B) describes the design. Uploading a new contract is out of scope for this prototype. |

## Run it locally

Needs Node.js 20 or newer.

```bash
npm install
npm run dev        # http://localhost:3000
# or
npm run build && npm start
```

No environment variables are needed. There is no database and no API key.

Useful scripts:

```bash
npm run validate     # checks every quote in the register and briefs against data/dataset (787 quotes)
npm run build:data   # rebuilds data/briefs.json, data/sources.json and data/tracker.json after editing a brief
npm run lint
```

## Deploy to Vercel (free Hobby plan)

1. Push this folder to a GitHub repository.
2. In Vercel choose **Add New, Project**, import the repository and keep the defaults (Framework: Next.js).
3. Click **Deploy**. No environment variables are required.
4. Open the URL. Check `/api/health` returns `"status":"ok"`.

## Screens

| Screen | What it shows |
|---|---|
| **Queue** (`/`) | The 15 drafts with counterparty, document, AtliQ entity, deadline from the tracker and meeting notes, highest severity and how many High findings have a decision. |
| **Brief** (`/brief/<slug>`) | Header and plain-English headline; exposure table; High and Medium findings with the draft quote beside the signed clause it collides with; earlier similar clauses labelled deliberate, waved through or unlabelled; documents the deal needs (signed, draft only, missing, referenced but absent); data type (asks a question when the contract is silent); NOT CHECKED list; checks that passed; decision buttons; a box that refuses to sign, send, negotiate or give legal advice; print to A4 PDF. |
| **Register** (`/register`) | Obligations from the 17 signed contracts, with the banner "17 of about 30 signed contracts", the Al Noor waiver attached to the clause it modifies, and a CSV export of every restrictive covenant, exclusivity and most-favoured-customer term for counsel. |
| **Decisions** | Every decision with who, when and why. An override needs a reason. |
| **Evaluation** | The metrics from PRD Section 11 against their thresholds, with expected and found for each case. |
| **Audit log** | Every view, export, print, decision, refused request and role switch, with the role used. |
| **User demo** (sidebar, or top strip on a phone) | A 9-step guided tour for new users: queue, a brief, a clash with a signed contract, recording a decision, the register, the evaluation, the decision log, the seller view and a close. The tour switches the view for you and ends in the reviewer view. Press Esc or the close button to leave it. |
| **Role switch** (top right) | Karandeep view or seller view. The seller sees flag types, severity, missing documents and "Ask Karandeep", with other clients' commercial terms and clause quotes hidden. The switch is not sign-in; production would sign users in. |

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
- Latency is not measured, because briefs are stored.

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
- Role switch is a cookie, not authentication. Decisions and the audit log live in one browser.
- The tracker value of the Kriti agreement ($10,100) is not reconciled with its INR fee because the sources give no exchange rate.

## Examiner API (read-only, JSON)

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
components/     brief views, decision panel, ask box, role switch
lib/            data loading, quote validation, seller redaction, evaluation, browser store
data/           register.json, briefs/, generated bundles, dataset/ (the capstone files)
scripts/        validate-quotes.mjs, build-data.mjs
spec/           the shared rules used to write the register and briefs
```
