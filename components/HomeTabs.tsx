"use client";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

type Tab = { id: string; label: string; content: ReactNode };

/** Tabbed block for the home page. Tab ids double as URL hashes (#features, #who, #trust, #faq), so top-nav links open the right tab. */
export default function HomeTabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0].id);
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const sync = () => {
      const h = window.location.hash.slice(1);
      if (tabs.some((t) => t.id === h)) {
        setActive(h);
        requestAnimationFrame(() => refs.current[h]?.scrollIntoView({ block: "start" }));
      }
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [tabs]);

  const pick = (id: string, focus = false) => {
    setActive(id);
    try { window.history.replaceState(null, "", `#${id}`); } catch { /* ignore */ }
    if (focus) refs.current[id]?.focus();
  };

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const n = tabs.length;
    let j = -1;
    if (e.key === "ArrowRight") j = (i + 1) % n;
    else if (e.key === "ArrowLeft") j = (i - 1 + n) % n;
    else if (e.key === "Home") j = 0;
    else if (e.key === "End") j = n - 1;
    if (j >= 0) { e.preventDefault(); pick(tabs[j].id, true); }
  };

  return (
    <div>
      <div role="tablist" aria-label="About the product" className="flex gap-1 overflow-x-auto border-b border-rule">
        {tabs.map((t, i) => {
          const on = t.id === active;
          return (
            <button
              key={t.id}
              id={t.id}
              ref={(el) => { refs.current[t.id] = el; }}
              role="tab"
              type="button"
              aria-selected={on}
              aria-controls={`${t.id}-panel`}
              tabIndex={on ? 0 : -1}
              onClick={() => pick(t.id)}
              onKeyDown={(e) => onKey(e, i)}
              className={`-mb-px scroll-mt-20 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold sm:text-base ${on ? "border-accent text-accent" : "border-transparent text-muted hover:text-ink"}`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {tabs.map((t) => (
        <div key={t.id} id={`${t.id}-panel`} role="tabpanel" aria-labelledby={t.id} hidden={t.id !== active} className="pt-8">
          {t.content}
        </div>
      ))}
    </div>
  );
}
