"use client";
import { useAudit } from "@/lib/store";
export default function AuditPage() {
  const rows = [...useAudit()].reverse();
  return (
    <div>
      <h1 className="text-3xl font-bold">Audit log</h1>
      <p className="mt-2 max-w-3xl text-muted">Every brief view, export, print, decision, refused request and role switch is recorded with the role used. The prototype uses a role switch instead of sign-in; production would sign users in. The log is kept in this browser only.</p>
      {rows.length === 0 ? <p className="card mt-6 rounded-lg border border-rule bg-card p-6 text-sm">Nothing logged yet.</p> : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-rule bg-card">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-paper text-xs uppercase tracking-wide text-muted"><tr><th className="p-3">Time</th><th className="p-3">Role</th><th className="p-3">Action</th><th className="p-3">Target</th><th className="p-3">Detail</th></tr></thead>
            <tbody>{rows.map((r, i) => <tr key={i} className="border-t border-rule align-top"><td className="p-3 whitespace-nowrap">{new Date(r.at).toLocaleString()}</td><td className="p-3">{r.role}</td><td className="p-3">{r.action}</td><td className="p-3 break-all">{r.target}</td><td className="p-3 text-muted">{r.detail ?? ""}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
