"use client";
import { useDecisions } from "@/lib/store";

/** Decision status of one finding, read from this browser. Only findings marked Decide before signing need one. */
export default function FindingStatus({ slug, id, needed }: { slug: string; id: string; needed: boolean }) {
  const d = useDecisions().find((x) => x.key === `${slug}:${id}`);
  if (d) return <span className="text-xs font-semibold text-ok">Decided: {d.choice}</span>;
  return <span className="text-xs text-muted">{needed ? "Decision needed" : "Optional"}</span>;
}
