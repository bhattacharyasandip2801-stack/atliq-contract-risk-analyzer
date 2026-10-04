import Link from "next/link";
import { sortedBriefs, highestSeverity, countBy, deadlineIso } from "@/lib/data";
import { getRole } from "@/lib/role";
import { SeverityBadge } from "@/components/Badges";
import DecisionProgress from "@/components/DecisionProgress";

export const dynamic = "force-dynamic";

function fmt(iso: string | null) {
  if (!iso) return "No date in the notes";
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export default async function QueuePage() {
  const role = await getRole();
  const briefs = sortedBriefs();
  const highs = briefs.reduce((n, b) => n + countBy(b).high, 0);
  return (
    <div>
      <h1 className="text-3xl font-bold">Contract queue</h1>
      <p className="mt-2 max-w-3xl text-muted">
        The 15 incoming drafts in the capstone dataset, ordered by the deadline written in the tracker and meeting notes. Open one for a ranked brief in which every finding quotes the contract.
        {role === "seller" && " You are in the seller view: you see flag types, missing documents and what to ask Karandeep."}
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[["Drafts", String(briefs.length)], ["High findings", role === "reviewer" ? String(highs) : "Ask Karandeep"], ["Clean drafts", String(briefs.filter((b) => highestSeverity(b) === "Low" || highestSeverity(b) === "None").length)], ["Signed contracts in register", "17 of about 30"]].map(([k, v]) => (
          <div key={k} className="card rounded-lg border border-rule bg-card p-3"><dt className="text-xs uppercase tracking-wide text-muted">{k}</dt><dd className="font-serif text-2xl font-bold">{v}</dd></div>
        ))}
      </dl>

      <div className="mt-6 hidden overflow-hidden rounded-lg border border-rule bg-card md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-paper text-xs uppercase tracking-wide text-muted">
            <tr><th className="p-3">Counterparty and document</th><th className="p-3">AtliQ entity</th><th className="p-3">Deadline</th><th className="p-3">Highest</th><th className="p-3">{role === "reviewer" ? "Decisions" : "Status"}</th><th className="p-3"><span className="sr-only">Open</span></th></tr>
          </thead>
          <tbody>
            {briefs.map((b) => {
              const c = countBy(b);
              return (
                <tr key={b.slug} className="border-t border-rule align-top hover:bg-accent-bg/40">
                  <td className="p-3"><Link className="font-semibold text-accent underline" href={`/brief/${b.slug}`}>{b.counterparty}</Link><div className="text-xs text-muted">{b.doc_type.replace(/\s*\(.*$/, "")} · {b.tracker_id}</div></td>
                  <td className="p-3">{b.atliq_entity_in_draft.replace("AtliQ Technologies Private Limited (Pvt Ltd)", "AtliQ Technologies Pvt Ltd")}</td>
                  <td className="p-3 whitespace-nowrap">{fmt(deadlineIso(b.slug))}</td>
                  <td className="p-3"><SeverityBadge s={highestSeverity(b)} />{role === "reviewer" && <div className="mt-1 text-xs text-muted">{c.high} High · {c.medium} Medium · {c.low} Low</div>}</td>
                  <td className="p-3">{role === "reviewer" ? <DecisionProgress slug={b.slug} ids={b.findings.filter((f) => f.severity === "High").map((f) => f.id)} /> : <span className="text-xs text-muted">Brief ready</span>}</td>
                  <td className="p-3 text-right"><Link className="rounded border border-rule px-2.5 py-1 hover:bg-accent-bg" href={`/brief/${b.slug}`}>Open</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="mt-6 grid gap-3 md:hidden">
        {briefs.map((b) => {
          const c = countBy(b);
          return (
            <li key={b.slug} className="card rounded-lg border border-rule bg-card p-3">
              <Link className="font-semibold text-accent underline" href={`/brief/${b.slug}`}>{b.counterparty}</Link>
              <div className="text-xs text-muted">{b.doc_type.replace(/\s*\(.*$/, "")} · {b.tracker_id}</div>
              <div className="mt-2 flex flex-wrap items-center gap-2"><SeverityBadge s={highestSeverity(b)} />{role === "reviewer" && <span className="text-xs text-muted">{c.high} High · {c.medium} Medium</span>}</div>
              <div className="mt-1 text-xs text-muted">Deadline: {fmt(deadlineIso(b.slug))}</div>
              {role === "reviewer" && <div className="mt-1"><DecisionProgress slug={b.slug} ids={b.findings.filter((f) => f.severity === "High").map((f) => f.id)} /></div>}
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-xs text-muted">Deadlines come from the tracker notes and the 22 Sep, 25 Sep and 27 Sep meeting notes. Where the notes give none, the row says so.</p>
    </div>
  );
}
