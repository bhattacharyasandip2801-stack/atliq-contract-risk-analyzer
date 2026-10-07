"use client";
import { useReviews } from "@/lib/store";
import { TARGET_SECONDS, fmt } from "./FiveMinute";

/** Review times recorded in this browser by the timer on each brief. Not stored on a server. */
export default function ReviewTimes({ names }: { names: Record<string, string> }) {
  const done = useReviews().filter((r) => r.end && r.seconds).sort((a, b) => (b.end ?? "").localeCompare(a.end ?? ""));
  const within = done.filter((r) => (r.seconds ?? 0) <= TARGET_SECONDS).length;
  return (
    <section className="card mt-5 rounded-lg border border-rule bg-card p-4" aria-label="Review times">
      <h2 className="text-base font-semibold">Review time (target: under 5 minutes per contract)</h2>
      <p className="text-xs text-muted">Measured in this browser by the timer on each brief, from first opening to the last High decision. Nothing is sent to a server.</p>
      {done.length === 0 ? <p className="mt-2 text-sm text-muted">No completed reviews yet. Open a brief, decide each High finding, and the time appears here.</p> : (
        <>
          <p className="mt-2 text-sm"><b>{within}</b> of <b>{done.length}</b> completed reviews finished within 5 minutes.</p>
          <ul className="mt-2 grid gap-1 text-sm">{done.map((r) => <li key={r.slug} className="flex flex-wrap items-center gap-2"><span className="font-medium">{names[r.slug] ?? r.slug}</span><span className="tabular-nums">{fmt(r.seconds ?? 0)}</span><span className={(r.seconds ?? 0) <= TARGET_SECONDS ? "text-ok" : "text-high"}>{(r.seconds ?? 0) <= TARGET_SECONDS ? "within target" : "over target"}</span></li>)}</ul>
        </>
      )}
    </section>
  );
}
