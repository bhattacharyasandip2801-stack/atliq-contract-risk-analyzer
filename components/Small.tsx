"use client";
import { useEffect } from "react";
import { useActor } from "./RoleProvider";
import { logAudit } from "@/lib/store";

export function AuditOnMount({ action, target }: { action: string; target: string }) {
  const actor = useActor();
  useEffect(() => { logAudit(actor, action, target); }, [actor, action, target]);
  return null;
}
export function PrintButton({ slug }: { slug: string }) {
  const actor = useActor();
  return <button className="no-print rounded border border-rule bg-card px-3 py-1.5 text-sm hover:bg-accent-bg" onClick={() => { logAudit(actor, "print", slug); window.print(); }}>Print or save as PDF</button>;
}
export function ExportLink({ href, children }: { href: string; children: React.ReactNode }) {
  const actor = useActor();
  return <a href={href} onClick={() => logAudit(actor, "export", href)} className="no-print inline-block rounded bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90">{children}</a>;
}
