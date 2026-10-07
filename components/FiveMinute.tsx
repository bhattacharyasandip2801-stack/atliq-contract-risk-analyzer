"use client";
import { useEffect, useState } from "react";
import { SeverityBadge } from "./Badges";
import { finishReview, resetReview, startReview, useDecisions, useReviews } from "@/lib/store";

export const TARGET_SECONDS = 300;
export const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
export interface GlanceRow { id: string; severity: "High" | "Medium"; title: string; clause_ref: string }

/** "Decide in 5 minutes": every finding on one screen, a reading-time estimate and a timer that stops when all High findings have a recorded decision. */
export default function FiveMinute({ slug, rows, readMinutes, words }: { slug: string; rows: GlanceRow[]; readMinutes: number; words: number }) {
  const decisions = useDecisions();
  const review = useReviews().find((r) => r.slug === slug);
  const highIds = rows.filter((r) => r.severity === "High").map((r) => r.id);
  const decided = (id: string) => decisions.find((d) => d.key === `${slug}:${id}`);
  // A decision only stops the clock if it was recorded after the clock started (so old demo decisions do not end a fresh run).
  const allHighDone = highIds.length > 0 && !!review && highIds.every((id) => { const d = decided(id); return !!d && d.at >= review.start; });
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => { startReview(slug); }, [slug]);
  useEffect(() => { if (allHighDone) finishReview(slug); }, [allHighDone, slug, review?.start]);
  useEffect(() => {
    const t0 = setTimeout(() => setNow(Date.now()), 0), t = setInterval(() => setNow(Date.now()), 1000);
    return () => { clearTimeout(t0); clearInterval(t); };
  }, []);

  const running = !!review && !review.end;
  const elapsed = review?.end ? review.seconds ?? 0 : review && now ? Math.max(0, Math.round((now - new Date(review.start).getTime()) / 1000)) : 0;
  const within = elapsed <= TARGET_SECONDS;
  return (
    <section aria-labelledby="glance" className="card rounded-lg border border-rule bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="glance" className="text-lg font-semibold">Decide in 5 minutes</h2>
          <p className="text-sm text-muted">Every finding on one screen. Select a title to jump to its quote and clause.</p>
        </div>
        <div className="no-print text-right" role="timer" aria-label="Review timer">
          <div className={`text-2xl font-bold tabular-nums ${running ? (within ? "text-ink" : "text-high") : within ? "text-ok" : "text-high"}`}>{fmt(elapsed)}</div>
          <div className="text-xs text-muted">{review?.end ? (within ? "Reviewed within the 5-minute target" : "Reviewed, over the 5-minute target") : highIds.length === 0 ? "No High findings to decide" : `Stops when all ${highIds.length} High are decided. Target: under 5:00`}</div>
          <button type="button" onClick={() => { resetReview(slug); startReview(slug); }} className="mt-1 text-xs underline">Restart timer</button>
        </div>
      </div>
      <div className="mt-3 overflow-x-auto" tabIndex={0} role="region" aria-label="Findings at a glance">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-muted"><tr><th className="py-1.5 pr-3">Level</th><th className="py-1.5 pr-3">Finding</th><th className="py-1.5 pr-3">Clause</th><th className="py-1.5">Decision</th></tr></thead>
          <tbody>{rows.map((r) => {
            const d = decided(r.id);
            return (
              <tr key={r.id} className="border-t border-rule align-top">
                <td className="py-2 pr-3"><SeverityBadge s={r.severity} /></td>
                <td className="py-2 pr-3"><a className="text-accent underline" href={`#${r.id}`}>{r.title}</a></td>
                <td className="py-2 pr-3 text-muted">{r.clause_ref}</td>
                <td className="py-2">{d ? <span className="font-medium text-ok">{d.choice}</span> : <span className="text-muted">{r.severity === "High" ? "Needed" : "Optional"}</span>}</td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted">Reading time: about {readMinutes} minute{readMinutes === 1 ? "" : "s"} for the {words.toLocaleString()} words in the headline, findings and quotes (estimate at 230 words per minute, reading only; deciding takes extra). The timer above measures real time in this browser, from first opening this brief to the last High decision. To time a fresh run, undo the old decisions, then restart the timer.</p>
    </section>
  );
}
