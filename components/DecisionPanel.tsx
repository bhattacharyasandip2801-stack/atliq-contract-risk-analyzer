"use client";
import { useState } from "react";
import { useActor, useUser } from "./RoleProvider";
import { clearDecision, saveDecision, useDecisions, type Decision } from "@/lib/store";

// Colour carries meaning: green = go ahead, amber = ask for changes, red = stop, violet = go ahead against the rule (needs a reason).
const CHOICES: { v: Decision["choice"]; t: string; icon: string; idle: string; on: string; chip: string }[] = [
  { v: "accept", t: "Accept", icon: "✓", idle: "border-ok/50 bg-ok-bg text-ok hover:border-ok", on: "border-ok bg-ok text-white", chip: "text-ok" },
  { v: "negotiate", t: "Negotiate", icon: "⇄", idle: "border-medium/50 bg-medium-bg text-medium hover:border-medium", on: "border-medium bg-medium text-white", chip: "text-medium" },
  { v: "reject", t: "Reject", icon: "✕", idle: "border-high/50 bg-high-bg text-high hover:border-high", on: "border-high bg-high text-white", chip: "text-high" },
  { v: "override", t: "Override", icon: "!", idle: "border-accent/50 bg-accent-bg text-accent hover:border-accent", on: "border-accent bg-accent text-white", chip: "text-accent" },
];

export default function DecisionPanel({ slug, findingId, title, required }: { slug: string; findingId: string; title: string; required: boolean }) {
  const actor = useActor();
  const user = useUser();
  const key = `${slug}:${findingId}`;
  const existing = useDecisions().find((d) => d.key === key);
  const [choice, setChoice] = useState<Decision["choice"] | null>(null);
  const [reason, setReason] = useState("");
  const [person, setPerson] = useState(user?.name ?? "Karandeep");
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(false);

  if (existing) {
    return (
      <div className="no-print mt-3 flex flex-wrap items-center gap-3 rounded border border-ok/30 bg-ok-bg px-3 py-2 text-sm" aria-live="polite">
        <span className={`font-semibold ${CHOICES.find((c) => c.v === existing.choice)?.chip ?? "text-ok"}`}>Decision recorded: {existing.choice}</span>
        <span className="text-muted">by {existing.person} on {new Date(existing.at).toLocaleString()}{existing.reason ? ` (${existing.reason})` : ""}</span>
        <button className="ml-auto text-xs underline" onClick={() => clearDecision(key, actor)}>Change decision</button>
      </div>
    );
  }
  function save() {
    if (!choice) return;
    if (choice === "override" && reason.trim().length < 5) { setErr("An override needs a reason (at least a short sentence)."); return; }
    saveDecision({ key, slug, findingId, choice, reason: reason.trim(), person: person.trim() || "Karandeep", role: actor, title });
    setChoice(null); setReason(""); setErr("");
    window.dispatchEvent(new CustomEvent("atliq-decided", { detail: { slug, findingId } }));
  }
  if (!required && !open && !choice) {
    return <div className="no-print mt-3"><button type="button" onClick={() => setOpen(true)} className="text-sm text-accent underline">Record a decision (optional)</button></div>;
  }
  return (
    <div className="no-print mt-3 rounded border border-rule bg-paper px-3 py-2">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold">{required ? "Decision needed:" : "Decision (optional):"}</span>
        {CHOICES.map((c) => (
          <button key={c.v} onClick={() => { setChoice(c.v); setErr(""); }} aria-pressed={choice === c.v}
            className={`rounded-md border px-3 py-1.5 text-sm font-semibold ${choice === c.v ? c.on : c.idle}`}><span aria-hidden="true" className="mr-1">{c.icon}</span>{c.t}</button>
        ))}
      </div>
      {choice && (
        <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
          <label className="text-xs text-muted">Reason {choice === "override" ? "(required)" : "(optional)"}
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className="mt-1 w-full rounded border border-rule bg-card p-2 text-sm text-ink" />
          </label>
          <div className="flex flex-col gap-2 sm:w-44">
            <label className="text-xs text-muted">Decided by
              <input value={person} onChange={(e) => setPerson(e.target.value)} className="mt-1 w-full rounded border border-rule bg-card p-1.5 text-sm text-ink" />
            </label>
            <button onClick={save} className="rounded-md bg-nav px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90">Save decision</button>
          </div>
          {err && <p className="text-xs text-high sm:col-span-2" role="alert">{err}</p>}
        </div>
      )}
    </div>
  );
}
