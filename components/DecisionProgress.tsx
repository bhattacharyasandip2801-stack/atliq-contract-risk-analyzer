"use client";
import { useDecisions } from "@/lib/store";
export default function DecisionProgress({ slug, ids, big }: { slug: string; ids: string[]; big?: boolean }) {
  const d = useDecisions();
  const done = ids.filter((id) => d.some((x) => x.key === `${slug}:${id}`)).length;
  if (ids.length === 0) return <span className="text-sm text-muted">Nothing to decide</span>;
  const ok = done === ids.length;
  return (
    <span className={`${big ? "text-sm" : "text-xs"} ${ok ? "font-semibold text-ok" : "text-muted"}`}>
      {done} of {ids.length} decided{ok ? ", reviewed" : ""}
    </span>
  );
}
