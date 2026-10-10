"use client";
import { SeverityBadge } from "./Badges";
import Gloss from "./Gloss";
import { useDecisions } from "@/lib/store";

export interface GlanceRow { id: string; severity: "High" | "Medium"; title: string; clause_ref: string }

/** "Decision checklist": every finding on one screen with its decision status. */
export default function FiveMinute({ slug, rows }: { slug: string; rows: GlanceRow[] }) {
  const decisions = useDecisions();
  const decided = (id: string) => decisions.find((d) => d.key === `${slug}:${id}`);
  return (
    <section aria-labelledby="glance" className="card rounded-lg border border-rule bg-card p-5">
      <h2 id="glance" className="text-lg font-semibold">Decision checklist</h2>
      <p className="text-sm text-muted">Every finding in this draft and whether you have decided it. Select a title to jump to its quote and clause.</p>
      <div className="mt-3 hidden overflow-x-auto sm:block" tabIndex={0} role="region" aria-label="Findings at a glance">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-muted"><tr><th className="py-1.5 pr-3">Level</th><th className="py-1.5 pr-3">Finding</th><th className="py-1.5 pr-3">Clause</th><th className="py-1.5">Decision</th></tr></thead>
          <tbody>{rows.map((r) => {
            const d = decided(r.id);
            return (
              <tr key={r.id} className="border-t border-rule align-top">
                <td className="py-2 pr-3"><SeverityBadge s={r.severity} /></td>
                <td className="py-2 pr-3"><a className="text-accent underline" href={`#${r.id}`}><Gloss text={r.title} /></a></td>
                <td className="py-2 pr-3 text-muted">{r.clause_ref}</td>
                <td className="py-2">{d ? <span className="font-medium text-ok">{d.choice}</span> : <span className="text-muted">{r.severity === "High" ? "Needed" : "Not required"}</span>}</td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
      <ul className="mt-3 grid gap-2 sm:hidden">{rows.map((r) => {
        const d = decided(r.id);
        return (
          <li key={r.id} className="rounded-md border border-rule p-3 text-sm">
            <div className="flex items-center justify-between gap-2"><SeverityBadge s={r.severity} /><span className="text-xs text-muted">{r.clause_ref}</span></div>
            <a className="mt-1.5 block text-accent underline" href={`#${r.id}`}><Gloss text={r.title} /></a>
            <div className="mt-1 text-xs">{d ? <span className="font-medium text-ok">{d.choice}</span> : <span className="text-muted">{r.severity === "High" ? "Decision needed" : "Decision not required"}</span>}</div>
          </li>
        );
      })}</ul>
    </section>
  );
}
