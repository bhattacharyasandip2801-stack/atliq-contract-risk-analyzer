"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useRole } from "./RoleProvider";
import { logAudit } from "@/lib/store";

export default function RoleSwitch({ light = false }: { light?: boolean }) {
  const role = useRole();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function set(next: "reviewer" | "seller") {
    if (next === role || busy) return;
    setBusy(true);
    await fetch("/api/role", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ role: next }) });
    logAudit(next, "role switch", next === "seller" ? "Seller view" : "Karandeep view");
    router.refresh();
    setBusy(false);
  }
  const base = "flex-1 px-2 py-1.5 text-xs font-medium transition-colors";
  return (
    <div className={`flex w-full overflow-hidden rounded-md border ${light ? "border-rule bg-card" : "border-white/20 bg-white/5"}`} role="group" aria-label="View as">
      <button onClick={() => set("reviewer")} aria-pressed={role === "reviewer"} className={`${base} ${role === "reviewer" ? (light ? "bg-accent text-white" : "bg-white text-nav") : light ? "text-ink hover:bg-accent-bg" : "text-white/80 hover:bg-white/10"}`}>Reviewer</button>
      <button onClick={() => set("seller")} aria-pressed={role === "seller"} className={`${base} border-l ${light ? "border-rule" : "border-white/20"} ${role === "seller" ? (light ? "bg-accent text-white" : "bg-white text-nav") : light ? "text-ink hover:bg-accent-bg" : "text-white/80 hover:bg-white/10"}`}>Seller</button>
    </div>
  );
}
