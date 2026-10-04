"use client";
import { useEffect } from "react";
import { useRole, roleName } from "./RoleProvider";
import { logAudit } from "@/lib/store";

export function AuditOnMount({ action, target }: { action: string; target: string }) {
  const role = useRole();
  useEffect(() => { logAudit(roleName(role), action, target); }, [role, action, target]);
  return null;
}
export function PrintButton({ slug }: { slug: string }) {
  const role = useRole();
  return <button className="no-print rounded border border-rule bg-card px-3 py-1.5 text-sm hover:bg-accent-bg" onClick={() => { logAudit(roleName(role), "print", slug); window.print(); }}>Print or save as PDF</button>;
}
export function ExportLink({ href, children }: { href: string; children: React.ReactNode }) {
  const role = useRole();
  return <a href={href} onClick={() => logAudit(roleName(role), "export", href)} className="no-print inline-block rounded bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90">{children}</a>;
}
