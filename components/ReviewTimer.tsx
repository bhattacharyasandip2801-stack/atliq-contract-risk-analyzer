"use client";
import { useEffect, useRef, useState } from "react";
import { finishReview, resetReview, saveSpent, startReview, useDecisions, useReviews } from "@/lib/store";

export const TARGET_SECONDS = 300;
export const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/** Optional review timer. It starts only when the reviewer presses Start timer, counts only while the brief is open and visible,
 *  and stops at the last "Decide before signing" decision recorded after the start. */
export default function ReviewTimer({ slug, highIds }: { slug: string; highIds: string[] }) {
  const decisions = useDecisions();
  // A record without an end or a spent count was auto-started by an older version; treat it as not started.
  const review = useReviews().find((r) => r.slug === slug && (r.end || r.spent !== undefined));
  const decided = (id: string) => decisions.find((d) => d.key === `${slug}:${id}`);
  const allHighDone = highIds.length > 0 && !!review && highIds.every((id) => { const d = decided(id); return !!d && d.at >= review.start; });
  const [live, setLive] = useState<{ k: string; v: number } | null>(null);
  const secsRef = useRef(0);
  const running = !!review && !review.end;
  const secs = !review ? 0 : review.end ? review.seconds ?? 0 : live && live.k === review.start ? live.v : review.spent ?? 0;

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
    <div role="timer" aria-label="Review timer" className="no-print">
      {!review ? (
        <>
          <button type="button" onClick={() => startReview(slug)} className="flex w-full items-center justify-center gap-2 rounded-md bg-ok px-3 py-2 text-sm font-semibold text-white hover:opacity-90"><span aria-hidden="true">▶</span> Start timer (optional)</button>
          <div className="mt-1 text-xs text-muted">Target: under 5:00. Starts only when you press it.</div>
        </>
      ) : (
        <>
          <div className="flex items-baseline justify-between gap-2">
            <span className={`text-2xl font-bold tabular-nums ${running ? (within ? "text-ink" : "text-high") : within ? "text-ok" : "text-high"}`}><span aria-hidden="true" className="mr-1 text-base">⏱</span>{fmt(secs)}</span>
            <button type="button" onClick={() => { secsRef.current = 0; setLive(null); resetReview(slug); }} className="text-xs underline">Reset</button>
          </div>
          <div className="text-xs text-muted">{review.end ? (within ? "Reviewed within the 5-minute target" : "Reviewed, over the 5-minute target") : "Running. Target: under 5:00. Stops at your last Decide before signing decision."}</div>
        </>
      )}
    </div>
  );
}
