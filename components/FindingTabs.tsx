"use client";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useDecisions } from "@/lib/store";

export interface TabItem { id: string; title: string; clause: string; node: ReactNode }
export interface TabGroup { key: "High" | "Medium"; label: string; items: TabItem[] }

const TONE = {
  High: { tab: "border-high text-high", on: "bg-high text-white border-high", dot: "bg-high", rail: "border-l-high" },
  Medium: { tab: "border-medium text-medium", on: "bg-medium text-white border-medium", dot: "bg-medium", rail: "border-l-medium" },
} as const;

/** Findings one at a time: pick a level, then step through its findings without scrolling. All panels stay in the page so print shows everything. */
export default function FindingTabs({ slug, groups }: { slug: string; groups: TabGroup[] }) {
  const decisions = useDecisions();
  const decided = useCallback((id: string) => decisions.some((d) => d.key === `${slug}:${id}`), [decisions, slug]);
  const [gk, setGk] = useState<TabGroup["key"]>(groups[0].key);
  const [sel, setSel] = useState<Record<string, number>>({});
  const box = useRef<HTMLElement>(null);
  const group = groups.find((g) => g.key === gk) ?? groups[0];
  const idx = Math.min(sel[group.key] ?? 0, group.items.length - 1);

  const go = useCallback((key: TabGroup["key"], i: number, scroll = false) => {
    setGk(key); setSel((s) => ({ ...s, [key]: i }));
    if (scroll) setTimeout(() => box.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 30);
  }, []);

  // Keep the chosen finding visible inside the scrolling strip.
  useEffect(() => {
    box.current?.querySelector<HTMLElement>("[data-rail][aria-selected=true]")?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [gk, idx]);

  // Links such as #f3, #high and #med (from the at-a-glance list, the worklist and "On this page") open the right tab.
  useEffect(() => {
    const fromHash = () => {
      const h = decodeURIComponent(location.hash.replace(/^#/, ""));
      if (!h) return;
      if (h === "high" || h === "med") { const g = groups.find((x) => x.key === (h === "high" ? "High" : "Medium")); if (g) go(g.key, 0, true); return; }
      for (const g of groups) { const i = g.items.findIndex((it) => it.id === h); if (i >= 0) { go(g.key, i, true); return; } }
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [groups, go]);

  // After a decision is saved, move on to the next finding that still needs one.
  useEffect(() => {
    const onDecided = (e: Event) => {
      const d = (e as CustomEvent<{ slug: string; findingId: string }>).detail;
      if (d.slug !== slug) return;
      const g = groups.find((x) => x.items.some((it) => it.id === d.findingId));
      if (!g) return;
      const at = g.items.findIndex((it) => it.id === d.findingId);
      const order = [...g.items.slice(at + 1), ...g.items.slice(0, at)];
      const next = order.find((it) => !decisions.some((x) => x.key === `${slug}:${it.id}`) && it.id !== d.findingId);
      if (next && g.key === "High") setTimeout(() => go(g.key, g.items.findIndex((it) => it.id === next.id), true), 700);
    };
    window.addEventListener("atliq-decided", onDecided);
    return () => window.removeEventListener("atliq-decided", onDecided);
  }, [groups, slug, decisions, go]);

  return (
    <section ref={box} aria-label="Findings" className="card scroll-mt-4 rounded-lg border border-rule bg-card p-5">
      <span id="high" /><span id="med" />
      <h2 className="sec-h">Findings</h2>
      <div role="tablist" aria-label="Finding level" className="no-print flex flex-wrap gap-2">
        {groups.map((g) => {
          const done = g.items.filter((it) => decided(it.id)).length; const on = g.key === group.key;
          return (
            <button key={g.key} role="tab" aria-selected={on} type="button" onClick={() => go(g.key, sel[g.key] ?? 0)}
              className={`rounded-lg border-2 px-4 py-2 text-left text-sm font-semibold ${on ? TONE[g.key].on : `bg-card ${TONE[g.key].tab}`}`}>
              {g.label} ({g.items.length})
              {g.key === "High" && <span className={`block text-xs font-normal ${on ? "text-white/90" : "text-muted"}`}>{done} of {g.items.length} decided</span>}
            </button>
          );
        })}
      </div>

      {groups.map((g) => (
        <div key={g.key} className={`${g.key === group.key ? "" : "hidden"} mt-4 print:!block`}>
          <h2 className="mb-3 hidden text-lg font-semibold print:block">{g.label} ({g.items.length})</h2>
          <div className="grid gap-3">
            <div role="tablist" aria-label={`${g.label} findings`} className="no-print flex gap-2 overflow-x-auto pb-1">
              {g.items.map((it, i) => {
                const on = g.key === group.key && i === idx; const ok = decided(it.id);
                return (
                  <button key={it.id} data-rail role="tab" aria-selected={on} type="button" onClick={() => go(g.key, i)}
                    className={`flex w-56 shrink-0 items-start gap-2 rounded-md border border-l-4 p-2.5 text-left text-sm ${TONE[g.key].rail} ${on ? "border-accent bg-accent-bg font-semibold" : "border-rule bg-card hover:bg-accent-bg"}`}>
                    <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold ${ok ? "bg-ok text-white" : "bg-low-bg text-low"}`} aria-label={ok ? "decided" : "not decided"}>{ok ? "✓" : i + 1}</span>
                    <span className="line-clamp-2 leading-snug">{it.title}<span className="block text-xs font-normal text-muted">{it.clause}</span></span>
                  </button>
                );
              })}
            </div>
            <div className="min-w-0">
              {g.items.map((it, i) => (
                <div key={it.id} role="tabpanel" className={`${g.key === group.key && i === idx ? "" : "hidden"} scroll-mt-4 print:!block print:mb-4`}>
                  {it.node}
                  <div className="no-print mt-3 flex items-center justify-between gap-2 text-sm">
                    <button type="button" disabled={i === 0} onClick={() => go(g.key, i - 1, true)} className="rounded-md border border-rule bg-card px-3 py-1.5 font-medium hover:bg-accent-bg disabled:opacity-40">← Previous</button>
                    <span className="text-muted">Finding {i + 1} of {g.items.length}</span>
                    <button type="button" disabled={i === g.items.length - 1} onClick={() => go(g.key, i + 1, true)} className="rounded-md bg-accent px-3 py-1.5 font-semibold text-white hover:opacity-90 disabled:opacity-40">Next →</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
