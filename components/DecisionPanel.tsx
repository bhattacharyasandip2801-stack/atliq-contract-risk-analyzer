"use client";
import { useState } from "react";
import { useRole, roleName } from "./RoleProvider";
import { clearDecision, saveDecision, useDecisions, type Decision } from "@/lib/store";

const CHOICES: { v: Decision["choice"]; t: string }[] = [
  { v: "accept", t: "Accept" }, { v: "negotiate", t: "Negotiate" }, { v: "reject", t: "Reject" }, { v: "override", t: "Override" },
];

export default function DecisionPanel({ slug, findingId, title, required }: { slug: string; findingId: string; title: string; required: boolean }) {
  const role = useRole();
  const key = `${slug}:${findingId}`;
  const existing = useDecisions().find((d) => d.key === key);
  const [choice, setChoice] = useState<Decision["choice"] | null>(null);
  const [reason, setReason] = useState("");
  const [person, setPerson] = useState("Karandeep");
  const [err, setErr] = useState("");

  if (existing) {
    return (
      <div className="no-print mt-3 flex flex-wrap items-center gap-3 rounded border border-ok/30 bg-ok-bg px-3 py-2 text-sm" aria-live="polite">
        <span className="font-semibold text-ok">Decision recorded: {existing.choice}</span>
        <span className="text-muted">by {existing.person} on {new Date(existing.at).toLocaleString()}{existing.reason ? ` (${existing.reason})` : ""}</span>
        <button className="ml-auto text-xs underline" onClick={() => clearDecision(key, roleName(role))}>Undo</button>
      </div>
    );
  }
  function save() {
    if (!choice) return;
    if (choice === "override" && reason.trim().length < 5) { setErr("An override needs a reason (at least a short sentence)."); return; }
    saveDecision({ key, slug, findingId, choice, reason: reason.trim(), person: person.trim() || "Karandeep", role: roleName(role), title });
    setChoice(null); setReason(""); setErr("");
  }
  return (
    <div className="no-print mt-3 rounded border border-rule bg-paper px-3 py-2">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium">{required ? "Decision needed:" : "Decision (optional):"}</span>
        {CHOICES.map((c) => (
          <button key={c.v} onClick={() => { setChoice(c.v); setErr(""); }} aria-pressed={choice === c.v}
            className={`rounded border px-2.5 py-1 text-sm ${choice === c.v ? "border-accent bg-accent text-white" : "border-rule bg-card hover:bg-accent-bg"}`}>{c.t}</button>
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
            <button onClick={save} className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90">Save decision</button>
          </div>
          {err && <p className="text-xs text-high sm:col-span-2" role="alert">{err}</p>}
        </div>
      )}
    </div>
  );
}
