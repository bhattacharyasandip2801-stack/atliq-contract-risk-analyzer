"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useRole } from "./RoleProvider";
import { logAudit } from "@/lib/store";

export default function RoleSwitch() {
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
  const base = "px-3 py-1.5 text-sm font-medium transition-colors";
  return (
    <div className="inline-flex overflow-hidden rounded-md border border-rule bg-card" role="group" aria-label="View as">
      <button onClick={() => set("reviewer")} aria-pressed={role === "reviewer"} className={`${base} ${role === "reviewer" ? "bg-accent text-white" : "hover:bg-accent-bg"}`}>Karandeep view</button>
      <button onClick={() => set("seller")} aria-pressed={role === "seller"} className={`${base} border-l border-rule ${role === "seller" ? "bg-accent text-white" : "hover:bg-accent-bg"}`}>Seller view</button>
    </div>
  );
}
