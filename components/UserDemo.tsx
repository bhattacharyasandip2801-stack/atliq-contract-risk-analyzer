"use client";
import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useActor, useUser } from "./RoleProvider";
import { logAudit } from "@/lib/store";
import { actorLabel, userById } from "@/lib/users";

interface Step { href: string; person: "karandeep" | "jay"; title: string; body: string; tip?: string }

// Every statement below is taken from the stored briefs and the README, so the tour never claims more than the prototype does.
const STEPS: Step[] = [
  { href: "/", person: "karandeep", title: "Start at the contract dashboard", body: "These are the 15 incoming drafts from the capstone dataset, ordered by the deadline in the tracker and meeting notes. The coloured edge and badge show the highest severity in each draft.", tip: "The tour signs you in as Karandeep, then as Jay for the seller step, and back to Karandeep at the end." },
  { href: "/brief/harrington_health_msa#top", person: "karandeep", title: "Open a brief", body: "This is Harrington Health's master services agreement. The Exposure table shows the arithmetic: $4,200 for every calendar day a delivery slips, with no cap. Each finding below it quotes the contract.", tip: "The summary panel on the right lists the sections and your decision progress." },
  { href: "/brief/gulf_crown_hotels_msa#F-01", person: "karandeep", title: "See a clash with a signed contract", body: "On the left is the Gulf Crown draft clause. On the right are the clauses AtliQ already signed with Al Noor. Every quote is re-checked against its source file each time the page loads.", tip: "A finding whose quote fails the check is withheld, not shown." },
  { href: "/brief/gulf_crown_hotels_msa#F-01", person: "karandeep", title: "Record a decision", body: "Under each “Decide before signing” finding choose Accept, Negotiate, Reject or Override. An override needs a reason. The tool never signs, sends or negotiates for you.", tip: "Try it now. Your choice is kept in this browser only." },
  { href: "/register", person: "karandeep", title: "Check the obligation register", body: "Restrictive covenants, exclusivity and price-match terms taken from 17 signed contracts. The banner is honest: the register covers 17 of about 30 signed contracts.", tip: "Export counsel's list as a CSV." },
  { href: "/intake", person: "karandeep", title: "Review a new draft", body: "Paste a contract, upload a text file or pick a draft from the list, then press Review this draft. Rules read it in seconds: entity and country, delay damages with the amount per day, liability against the contract value (add a monthly fee and months, or a value), indemnity, payment, promises AtliQ has already made, and data type. Every finding quotes the text.", tip: "Try Harrington with a value of 210000, then LoopMart, which has nothing to decide before signing. The result always lists what was not checked." },
  { href: "/knowledge", person: "karandeep", title: "Ask the knowledge base", body: "Everything written down about contracts is searchable: signed contracts, drafts, Karandeep's checklist, negotiation notes, meeting notes and the entity sheet. Each passage is copied word for word and re-checked against its file.", tip: "Choose a suggested question, for example What did we promise Al Noor? An optional AI answer layer is off until the owner adds a key." },
  { href: "/playbook", person: "karandeep", title: "Read Karandeep's playbook", body: "His nine checklist rules, which drafts hit each one, the exceptions on record labelled deliberate or waved through, and the past negotiations. It used to live in his memory.", tip: "Open a negotiation to read it as written. A waved-through clause is never a precedent." },
  { href: "/evaluation", person: "karandeep", title: "Read the evaluation", body: "Each bar is a labelled check from the PRD. The labels are pending review by Karandeep and counsel, and the briefs came from the same documents, so a pass shows coverage, not accuracy on unseen contracts.", tip: "Citation accuracy is the one check that needs no one's judgement." },
  { href: "/decisions", person: "karandeep", title: "Review the decision log", body: "Every decision appears here with who decided, when and why. The audit log records views, exports, prints, decisions and refused requests.", tip: "If you recorded a decision in step 4, it is listed here." },
  { href: "/brief/lakeshore_grocers_msa", person: "jay", title: "See what a seller sees", body: "The demo has signed you in as Jay, a seller. Jay sees only the four drafts he requested, in the limited view: flag types, missing documents and what to ask Karandeep. Other clients' rates, terms and clause quotes are hidden.", tip: "Compare this page with the same brief as Karandeep." },
  { href: "/", person: "karandeep", title: "That is the tour", body: "You are signed in as Karandeep again. The briefs are pre-generated from the dataset and have not been reviewed by Karandeep or counsel. This tool gives no legal advice; for a legal conclusion, ask counsel.", tip: "Select Finish to close the tour." },
];

const KEY = "atliq.demo.step";
function subscribe(cb: () => void) {
  window.addEventListener("atliq-demo", cb); window.addEventListener("storage", cb);
  return () => { window.removeEventListener("atliq-demo", cb); window.removeEventListener("storage", cb); };
}
const snap = () => { try { return sessionStorage.getItem(KEY) ?? "-1"; } catch { return "-1"; } };
function put(i: number) { try { if (i < 0) sessionStorage.removeItem(KEY); else sessionStorage.setItem(KEY, String(i)); } catch { /* storage unavailable */ } window.dispatchEvent(new Event("atliq-demo")); }
const useStep = () => Number(useSyncExternalStore(subscribe, snap, () => "-1"));

function useDemo() {
  const router = useRouter();
  const current = useUser();
  const actor = useActor();
  async function go(i: number) {
    const s = STEPS[i];
    const switching = current?.id !== s.person;
    if (switching) {
      await fetch("/api/signin", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ user: s.person }) });
      logAudit(actorLabel(userById(s.person)!), "sign in", "user demo");
    }
    put(i);
    router.push(s.href);
    if (switching) router.refresh();
  }
  function exit() { put(-1); }
  return { go, exit, actor };
}

export function DemoStartButton({ variant = "sidebar" }: { variant?: "sidebar" | "inline" | "compact" }) {
  const { go, actor } = useDemo();
  const start = () => { logAudit(actor, "user demo started", "user demo"); void go(0); };
  const cls = {
    sidebar: "flex w-full items-center gap-2.5 rounded-md border border-white/25 px-3 py-2 text-sm font-medium text-white hover:bg-nav-hover",
    inline: "no-print rounded border border-accent px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent-bg",
    compact: "rounded border border-rule bg-card px-2.5 py-1 text-xs font-medium text-accent hover:bg-accent-bg",
  }[variant];
  return (
    <button type="button" onClick={start} className={cls}>
      {variant === "sidebar" && <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>}
      User demo
    </button>
  );
}

export function DemoPanel() {
  const step = useStep();
  const { go, exit } = useDemo();
  useEffect(() => {
    if (step < 0) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") put(-1); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);
  if (step < 0 || step >= STEPS.length) return null;
  const s = STEPS[step], last = step === STEPS.length - 1;
  return (
    <aside role="complementary" aria-label="User demo" className="no-print card fixed bottom-4 right-4 z-50 w-[22rem] max-w-[calc(100vw-2rem)] rounded-xl border border-accent/40 bg-card p-4 shadow-lg">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-accent">User demo · step {step + 1} of {STEPS.length}</span>
        <button type="button" onClick={exit} className="rounded px-1.5 text-lg leading-none text-muted hover:bg-accent-bg" aria-label="Close the user demo">×</button>
      </div>
      <div className="mt-2 flex gap-1" aria-hidden="true">{STEPS.map((_, i) => <i key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-accent" : "bg-rule"}`} />)}</div>
      <div aria-live="polite">
        <h2 className="mt-3 text-base font-semibold leading-snug">{s.title}</h2>
        <p className="mt-1.5 text-sm leading-relaxed">{s.body}</p>
        {s.tip && <p className="mt-2 rounded-md bg-accent-bg px-2.5 py-1.5 text-xs text-accent">{s.tip}</p>}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <button type="button" disabled={step === 0} onClick={() => go(step - 1)} className="rounded border border-rule px-3 py-1.5 text-sm hover:bg-accent-bg disabled:opacity-40">Back</button>
        {last
          ? <button type="button" onClick={exit} className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90">Finish</button>
          : <button type="button" onClick={() => go(step + 1)} className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90">Next</button>}
      </div>
    </aside>
  );
}
