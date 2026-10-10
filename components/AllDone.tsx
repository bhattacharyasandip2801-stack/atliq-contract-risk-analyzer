"use client";
import Link from "next/link";
import { useDecisions } from "@/lib/store";

/** Shown in the side panel once every "Decide before signing" finding has a decision: tells the reviewer what to do next. */
export default function AllDone({ slug, ids }: { slug: string; ids: string[] }) {
  const d = useDecisions();
  if (ids.length === 0 || !ids.every((id) => d.some((x) => x.key === `${slug}:${id}`))) return null;
  return (
    <div className="no-print rounded-md border border-ok/30 bg-ok-bg p-2.5 text-sm" role="status">
      <div className="font-semibold text-ok">All decisions recorded</div>
      <Link href="/" className="mt-1.5 block rounded-md bg-ok px-3 py-1.5 text-center font-semibold text-white hover:opacity-90">Next draft on the Dashboard →</Link>
    </div>
  );
}
