"use client";
import { useEffect, useRef, useState } from "react";
import { SeverityBadge } from "./Badges";
import Gloss from "./Gloss";
import { finishReview, resetReview, saveSpent, startReview, useDecisions, useReviews } from "@/lib/store";

export const TARGET_SECONDS = 300;
export const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
export interface GlanceRow { id: string; severity: "High" | "Medium"; title: string; clause_ref: string }

/** "Decide in 5 minutes": every finding on one screen, a reading-time estimate and a timer that stops when all High findings have a recorded decision. */
export default function FiveMinute({ slug, rows }: { slug: string; rows: GlanceRow[] }) {
  const decisions = useDecisions();
  const review = useReviews().find((r) => r.slug === slug);
  const highIds = rows.filter((r) => r.severity === "High").map((r) => r.id);
  const decided = (id: string) => decisions.find((d) => d.key === `${slug}:${id}`);
  // A decision only stops the clock if it was recorded after the clock was started.
  const allHighDone = highIds.length > 0 && !!review && highIds.every((id) => { const d = decided(id); return !!d && d.at >= review.start; });
  const [live, setLive] = useState<{ k: string; v: number } | null>(null);
  const secsRef = useRef(0);
  const running = !!review && !review.end;
  const secs = !review ? 0 : review.end ? review.seconds ?? 0 : live && live.k === review.start ? live.v : review.spent ?? 0;

  // The clock counts only while this brief is open and visible, so leaving the page or the tab pauses it.
  useEffect(() => {
    if (!review || review.end) return;
    const k = review.start;
    secsRef.current = Math.max(secsRef.current, review.spent ?? 0);
    const t = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      secsRef.current += 1; setLive({ k, v: secsRef.current });
      if (secsRef.current % 5 === 0) saveSpent(slug, secsRef.current);
    }, 1000);
    const flush = () => saveSpent(slug, secsRef.current);
    document.addEventListener("visibilitychange", flush);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", flush); flush(); };
  }, [slug, review?.start, review?.end]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (allHighDone) finishReview(slug, Math.max(secsRef.current, 1)); }, [allHighDone, slug]);

  const within = secs <= TARGET_SECONDS;
  return (
    <section aria-labelledby="glance" className="card rounded-lg border border-rule bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="glance" className="text-lg font-semibold">Decide in 5 minutes</h2>
          <p className="text-sm text-muted">Every finding on one screen. Select a title to jump to its quote and clause. The timer is optional: press Start timer when you begin. It counts only while this brief is open and stops at your last “Decide before signing” decision.</p>
        </div>
        <div className="no-print text-right" role="timer" aria-label="Review timer">
          {!review ? (
            <>
              <button type="button" onClick={() => startReview(slug)} className="rounded-md bg-ok px-4 py-2 text-sm font-semibold text-white hover:opacity-90">▶ Start timer (optional)</button>
              <div className="mt-1 text-xs text-muted">{highIds.length === 0 ? "Nothing to decide before signing" : `${highIds.length} to decide. Target: under 5:00`}</div>
            </>
          ) : (
            <>
              <div className={`text-2xl font-bold tabular-nums ${running ? (within ? "text-ink" : "text-high") : within ? "text-ok" : "text-high"}`}>{fmt(secs)}</div>
              <div className="text-xs text-muted">{review.end ? (within ? "Reviewed within the 5-minute target" : "Reviewed, over the 5-minute target") : `Running. ${highIds.length} to decide. Target: under 5:00`}</div>
              <button type="button" onClick={() => { secsRef.current = 0; setLive(null); resetReview(slug); }} className="mt-1 text-xs underline">Reset timer</button>
            </>
          )}
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
                <td className="py-2 pr-3"><a className="text-accent underline" href={`#${r.id}`}><Gloss text={r.title} /></a></td>
                <td className="py-2 pr-3 text-muted">{r.clause_ref}</td>
                <td className="py-2">{d ? <span className="font-medium text-ok">{d.choice}</span> : <span className="text-muted">{r.severity === "High" ? "Needed" : "Optional"}</span>}</td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
    </section>
  );
}
