"use client";
import { useState } from "react";
import { useRole, roleName } from "./RoleProvider";
import { logAudit } from "@/lib/store";

const REFUSE = /\b(sign|send|email|negotiate|redline|counter[- ]?offer|approve|execute|accept the contract|legal advice|is (this|it) legal|enforceable|lawsuit|sue)\b/i;
export default function AskBox({ slug }: { slug: string }) {
  const role = useRole();
  const [q, setQ] = useState("");
  const [a, setA] = useState<string | null>(null);
  function go(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    const refused = REFUSE.test(q);
    setA(refused
      ? "I can't sign, send or negotiate a contract, and I can't give legal advice or say whether a clause is legal or enforceable. I can show what the draft says, what it collides with and what it could cost. For a legal conclusion, ask counsel."
      : "This prototype answers only from the stored brief above, with no free-text questions. Use the findings, the NOT CHECKED list and the data-type question on this page. For anything else, ask Karandeep or counsel.");
    logAudit(roleName(role), refused ? "request refused" : "question not supported", slug, q.slice(0, 120));
  }
  return (
    <section className="no-print card rounded-lg border border-rule bg-card p-4">
      <h2 className="text-lg font-bold">Ask about this brief</h2>
      <p className="mt-1 text-sm text-muted">The tool does not sign, send, negotiate or give legal advice. Try asking it to.</p>
      <form onSubmit={go} className="mt-3 flex gap-2">
        <label className="sr-only" htmlFor="ask">Question</label>
        <input id="ask" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Should we sign this?" className="min-w-0 flex-1 rounded border border-rule bg-paper p-2 text-sm" />
        <button className="rounded border border-rule bg-card px-3 text-sm hover:bg-accent-bg">Ask</button>
      </form>
      {a && <p className="mt-3 rounded bg-low-bg p-3 text-sm" role="status">{a}</p>}
    </section>
  );
}
