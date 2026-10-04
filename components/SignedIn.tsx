"use client";
import { useRouter } from "next/navigation";
import { useActor, useUser } from "./RoleProvider";
import { logAudit } from "@/lib/store";
import { DemoStartButton } from "./UserDemo";

export function useSignOut() {
  const router = useRouter();
  const actor = useActor();
  return async () => {
    logAudit(actor, "sign out", "sign-in");
    try { sessionStorage.removeItem("atliq.demo.step"); } catch { /* storage unavailable */ }
    await fetch("/api/signout", { method: "POST" });
    router.push("/signin");
    router.refresh();
  };
}

export function SignedInCard() {
  const user = useUser();
  const signOut = useSignOut();
  if (!user) return null;
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/15 text-sm font-semibold" aria-hidden="true">{user.name[0]}</span>
      <div className="min-w-0 flex-1 leading-tight">
        <div className="truncate text-sm font-semibold">{user.name}</div>
        <div className="truncate text-xs text-white/60">{user.role === "reviewer" ? "Full access" : "Limited view"}</div>
      </div>
      <button type="button" onClick={signOut} className="rounded border border-white/25 px-2 py-1 text-xs hover:bg-nav-hover">Sign out</button>
    </div>
  );
}

export function MobileBar() {
  const user = useUser();
  const signOut = useSignOut();
  if (!user) return null;
  return (
    <div className="no-print flex items-center justify-between gap-2 border-b border-rule bg-card px-4 py-2 lg:hidden">
      <DemoStartButton variant="compact" />
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted">Signed in as <b className="text-ink">{user.name}</b></span>
        <button type="button" onClick={signOut} className="rounded border border-rule px-2 py-1 hover:bg-accent-bg">Sign out</button>
      </div>
    </div>
  );
}
