"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { logAudit } from "@/lib/store";
import { actorLabel, type DemoUser } from "@/lib/users";

export default function SignInCards({ people, next }: { people: (DemoUser & { drafts: number })[]; next: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");
  async function choose(u: DemoUser) {
    if (busy) return;
    setBusy(u.id); setErr("");
    try {
      const r = await fetch("/api/signin", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ user: u.id }) });
      if (!r.ok) throw new Error("failed");
      logAudit(actorLabel(u), "sign in", "demo sign-in");
      router.push(next);
      router.refresh();
    } catch { setErr("Sign-in did not work. Reload the page and try again."); setBusy(null); }
  }
  return (
    <div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {people.map((u) => {
          const full = u.role === "reviewer";
          return (
            <li key={u.id} className={full ? "sm:col-span-2" : ""}>
              <button type="button" onClick={() => choose(u)} disabled={busy !== null}
                className={`card flex h-full w-full items-start gap-3 rounded-lg border bg-card p-4 text-left hover:bg-accent-bg disabled:opacity-60 ${full ? "border-accent" : "border-rule"}`}>
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-base font-semibold text-white ${full ? "bg-accent" : "bg-nav"}`} aria-hidden="true">{u.name[0]}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-semibold">{u.name}</span>
                    {full && <span className="rounded bg-accent-bg px-2 py-0.5 text-xs font-semibold text-accent">Start here</span>}
                  </span>
                  <span className="block text-sm text-muted">{u.title}</span>
                  <span className="mt-1 block text-sm">{u.access}</span>
                  <span className="mt-1 block text-xs text-muted">{busy === u.id ? "Signing in..." : `${u.drafts} ${u.drafts === 1 ? "draft" : "drafts"} in view`}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {err && <p role="alert" className="mt-3 text-sm text-high">{err}</p>}
    </div>
  );
}
