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
  return <button className="no-print flex w-full items-center justify-center gap-2 rounded-md bg-nav px-3 py-2 text-sm font-semibold text-white hover:opacity-90" onClick={() => { logAudit(actor, "print", slug); window.print(); }}><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 9V4h10v5M7 17H5a2 2 0 01-2-2v-4a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2h-2M7 14h10v6H7z" /></svg>Print or save as PDF</button>;
}
export function ExportLink({ href, children }: { href: string; children: React.ReactNode }) {
  const actor = useActor();
  return <a href={href} onClick={() => logAudit(actor, "export", href)} className="no-print inline-block rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90">{children}</a>;
}
