import Link from "next/link";
import { runEvaluation } from "@/lib/eval";
import { getRole } from "@/lib/role";
import { Chip } from "@/components/Badges";
import { AuditOnMount } from "@/components/Small";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Evaluation" };

export const dynamic = "force-dynamic";

export default async function EvaluationPage() {
  if ((await getRole()) === "seller") return <p className="card rounded-lg border border-rule bg-card p-6 text-muted">The evaluation screen is for the Karandeep view.</p>;
  const r = runEvaluation();
  const pass = r.dimensions.filter((d) => d.status === "pass").length, fail = r.dimensions.filter((d) => d.status === "fail").length;
  return (
    <div>
      <AuditOnMount action="run evaluation" target="evaluation" />
      <h1 className="text-2xl font-bold">Evaluation</h1>
      <p className="mt-3 rounded-lg border border-medium/40 bg-medium-bg p-4 text-sm text-medium">{r.labelsNote}</p>
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[["Run at", new Date(r.generated).toLocaleString()], ["Model", "None (stored briefs)"], ["Tokens used", "0"], ["Result", `${pass} passed, ${fail} failed`]].map(([k, v]) => <div key={k} className="card rounded-lg border border-rule bg-card p-3"><dt className="text-xs uppercase tracking-wide text-muted">{k}</dt><dd className="text-sm font-semibold">{v}</dd></div>)}
      </dl>
      <p className="mt-2 text-xs text-muted"><Link className="text-accent underline" href="/evaluation">Run again</Link></p>
      <section className="card mt-5 rounded-lg border border-rule bg-card p-4" aria-label="Scorecard">
        <h2 className="text-base font-semibold">Scorecard</h2>
        <p className="text-xs text-muted">Each bar shows the share of labelled cases that passed. Grey bars are information only and are not graded.</p>
        <ul className="mt-3 grid gap-2">
          {r.dimensions.map((d) => {
            const m = /(\d+) of (\d+)/.exec(d.result);
            const pct = m && Number(m[2]) > 0 ? Math.round((Number(m[1]) / Number(m[2])) * 100) : null;
            const color = d.status === "fail" ? "bg-high" : d.status === "info" ? "bg-low" : "bg-ok";
            return (
              <li key={d.name} className="grid items-center gap-x-3 gap-y-1 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_5.5rem]">
                <span className="truncate text-sm font-medium" title={d.name}>{d.name}</span>
                <div className="h-2.5 overflow-hidden rounded-full bg-low-bg" role="img" aria-label={`${d.name}: ${pct ?? "no"}% passed`}>
                  {pct !== null && <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />}
                </div>
                <span className="text-right text-xs text-muted">{m ? `${m[1]} of ${m[2]}` : "n/a"}</span>
              </li>
            );
          })}
        </ul>
      </section>
      <h2 className="mt-6 text-base font-semibold">Detail by check</h2>
      <div className="mt-2 grid gap-3">
        {r.dimensions.map((d) => (
          <details key={d.name} className="card rounded-lg border border-rule bg-card p-4" open={d.status === "fail"}>
            <summary className="flex flex-wrap items-center gap-3">
              <span className={`inline-block rounded px-2 py-0.5 text-xs font-bold uppercase ${d.status === "pass" ? "bg-ok-bg text-ok" : d.status === "fail" ? "bg-high-bg text-high" : "bg-low-bg text-low"}`}>{d.status === "info" ? "Info" : d.status}</span>
              <span className="text-lg font-bold">{d.name}</span><span className="text-sm text-muted">Threshold: {d.threshold}</span><span className="ml-auto text-sm font-semibold">{d.result}</span>
            </summary>
            {d.note && <p className="mt-2 text-sm text-muted">{d.note}</p>}
            {d.checks.length > 0 && (
              <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-muted"><tr><th className="py-1 pr-3"> </th><th className="py-1 pr-3">Case</th><th className="py-1 pr-3">Expected</th><th className="py-1">Found</th></tr></thead>
                <tbody>{d.checks.map((c, i) => <tr key={i} className="border-t border-rule align-top"><td className="py-1.5 pr-3">{c.pass ? <Chip tone="ok">Pass</Chip> : <Chip tone="warn">Fail</Chip>}</td><td className="py-1.5 pr-3">{c.label}</td><td className="py-1.5 pr-3 text-muted">{c.expected}</td><td className="py-1.5 text-muted">{c.found}</td></tr>)}</tbody>
              </table></div>
            )}
          </details>
        ))}
      </div>
    </div>
  );
}
