"use client";
import Link from "next/link";
import { useDecisions, clearAll } from "@/lib/store";
import { Chip } from "@/components/Badges";
import { useRole } from "@/components/RoleProvider";

export default function DecisionsPage() {
  const decisions = useDecisions();
  const role = useRole();
  if (role === "seller") return <p className="card rounded-lg border border-rule bg-card p-6 text-muted">The decision log is for the Karandeep view.</p>;
  const sorted = [...decisions].sort((a, b) => b.at.localeCompare(a.at));
  return (
    <div>
      <h1 className="text-2xl font-bold">Decisions and exceptions</h1>
      <p className="mt-2 max-w-3xl text-muted">Every decision on a “Decide before signing” finding is kept here with who decided, when and why. An override needs a reason. This prototype keeps the log in this browser only.</p>
      {sorted.length === 0 ? (
        <p className="card mt-6 rounded-lg border border-rule bg-card p-6 text-sm">No decisions recorded yet. Open a brief from the <Link className="text-accent underline" href="/">queue</Link> and record one on a finding.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-rule bg-card" tabIndex={0} role="region" aria-label="Decision log">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-paper text-xs uppercase tracking-wide text-muted"><tr><th className="p-3">When</th><th className="p-3">Contract and finding</th><th className="p-3">Decision</th><th className="p-3">Reason</th><th className="p-3">By</th></tr></thead>
            <tbody>{sorted.map((d) => (
              <tr key={d.key} className="border-t border-rule align-top"><td className="p-3 whitespace-nowrap">{new Date(d.at).toLocaleString()}</td>
                <td className="p-3"><Link className="text-accent underline" href={`/brief/${d.slug}#${d.findingId}`}>{d.slug.replace(/_/g, " ")}</Link> <span className="text-muted">{d.findingId}</span><div className="text-xs text-muted">{d.title}</div></td>
                <td className="p-3"><Chip tone={d.choice === "override" ? "warn" : "accent"}>{d.choice}</Chip></td><td className="p-3">{d.reason || <span className="text-muted">none given</span>}</td><td className="p-3">{d.person}</td></tr>
            ))}</tbody>
          </table>
        </div>
      )}
      <p className="mt-4 text-xs text-muted">Exception labels (deliberate, waved through, unlabelled) appear inside each finding as “Earlier, similar clauses”.</p>
      {sorted.length > 0 && <button className="no-print mt-4 rounded border border-rule bg-card px-3 py-1.5 text-sm hover:bg-accent-bg" onClick={() => { if (confirm("Clear all decisions and the audit log in this browser?")) clearAll(); }}>Clear demo data</button>}
    </div>
  );
}
