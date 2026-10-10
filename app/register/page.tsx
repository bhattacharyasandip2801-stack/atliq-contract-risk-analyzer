import { REGISTER } from "@/lib/data";
import { getRole } from "@/lib/role";
import { Chip, EXC_LABEL, EXC_TONE } from "@/components/Badges";
import { ExportLink, AuditOnMount } from "@/components/Small";

import type { Metadata } from "next";
export const metadata: Metadata = { title: "Obligation register" };
export const dynamic = "force-dynamic";
const srcName = (f: string) => f.split("/").pop()!.replace(/\.md$/, "");
const COUNSEL_TYPES = ["restrictive_covenant", "exclusivity", "mfn"];
const TYPE_NAME: Record<string, string> = { restrictive_covenant: "Restrictive covenant", exclusivity: "Exclusivity", mfn: "Most-favoured customer", ip_promise: "IP promise", ld: "Delay damages", liability: "Liability", payment: "Payment", governing_law: "Law and courts", insurance: "Insurance", subcontractor: "Subcontracting", notice: "Notice and termination", data: "Data", waiver: "Waiver", other: "Other" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ type?: string; q?: string }> }) {
  const role = await getRole();
  if (role === "seller") {
    return <div className="card rounded-lg border border-rule bg-card p-6"><h1 className="text-2xl font-bold">Register</h1><p className="mt-2 text-muted">The register holds other clients&apos; commercial terms, so it is hidden in the seller view. Ask Karandeep for access.</p></div>;
  }
  const sp = await searchParams;
  const type = sp.type && sp.type !== "all" ? sp.type : "counsel";
  const q = (sp.q ?? "").toLowerCase();
  let rows = REGISTER.entries;
  if (type === "counsel") rows = rows.filter((e) => COUNSEL_TYPES.includes(e.type));
  else rows = rows.filter((e) => e.type === type);
  if (q) rows = rows.filter((e) => (e.contract + e.counterparty + e.summary + e.clause_ref).toLowerCase().includes(q));
  const types = [...new Set(REGISTER.entries.map((e) => e.type))].sort();
  const counselCount = REGISTER.entries.filter((e) => COUNSEL_TYPES.includes(e.type)).length;
  return (
    <div>
      <AuditOnMount action="view register" target="register" />
      <h1 className="text-2xl font-bold">Obligation register</h1>
      <p role="status" className="mt-3 rounded-lg border border-medium/40 bg-medium-bg p-4 text-sm text-medium"><span className="font-semibold">This register covers 17 of about 30 signed contracts.</span> {REGISTER.meta.note}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <form className="flex min-w-0 max-w-full flex-wrap items-end gap-2" action="/register">
          <label className="min-w-0 max-w-full text-xs text-muted">Show<select name="type" defaultValue={sp.type ?? "counsel"} className="mt-1 block w-full max-w-full rounded border border-rule bg-card p-2 text-sm text-ink">
            <option value="counsel">Counsel&apos;s list: restrictive covenants, exclusivity, MFN ({counselCount})</option>
            {types.map((t) => <option key={t} value={t}>{TYPE_NAME[t] ?? t}</option>)}
          </select></label>
          <label className="text-xs text-muted">Search<input name="q" defaultValue={sp.q ?? ""} className="mt-1 block rounded border border-rule bg-card p-2 text-sm text-ink" placeholder="contract or clause" /></label>
          <button className="rounded border border-rule bg-card px-3 py-2 text-sm hover:bg-accent-bg">Apply</button>
        </form>
        <div className="ml-auto"><ExportLink href="/api/register/export">Export counsel&apos;s list (CSV)</ExportLink></div>
      </div>
      <p className="mt-2 text-sm text-muted">{rows.length} entries shown. The Al Noor waiver letter of 10 Feb 2026 is attached to the Al Noor §12 entry rather than listed on its own.</p>
      <ul className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-3">
        {rows.map((e) => (
          <li key={e.id} className="card rounded-lg border border-rule bg-card p-4">
            <div className="flex flex-wrap items-center gap-2"><Chip tone="accent">{TYPE_NAME[e.type] ?? e.type}</Chip><Chip>{e.id}</Chip>{e.exception_label && <Chip tone={EXC_TONE[e.exception_label] ?? "plain"}>{EXC_LABEL[e.exception_label] ?? e.exception_label}</Chip>}</div>
            <h2 className="mt-2 text-lg font-bold">{e.contract} <span className="text-sm font-normal text-muted">{e.clause_ref}</span></h2>
            <p className="text-sm text-muted">{e.atliq_entity} · Affiliates bound: {e.binds_affiliates}{e.start_date || e.end_date ? ` · ${e.start_date ?? "?"} to ${e.end_date ?? "?"}` : ""}</p>
            <p className="mt-2 text-sm leading-relaxed">{e.summary}</p>
            {e.dates_note && <p className="mt-1 text-sm"><span className="font-medium">Dates: </span>{e.dates_note}</p>}
            {e.affiliates_note && <p className="mt-1 text-sm"><span className="font-medium">Affiliates: </span>{e.affiliates_note}</p>}
            <blockquote className="quote quote-signed mt-2 text-sm">“{e.quote}”<span className="block text-xs text-muted not-italic">Source: {srcName(e.file)}</span></blockquote>
            {e.waivers.map((w, i) => (
              <div key={i} className="mt-2 rounded border border-accent/30 bg-accent-bg p-3 text-sm"><span className="font-semibold text-accent">Waiver, {w.clause_ref}: </span>{w.limit}<blockquote className="quote mt-1 text-sm">“{w.quote}”<span className="block text-xs text-muted not-italic">Source: {srcName(w.file)}</span></blockquote></div>
            ))}
            {e.exception_note && <p className="mt-2 text-xs text-muted">Why labelled: {e.exception_note}</p>}
          </li>
        ))}
      </ul>
      {REGISTER.not_checked.length > 0 && (
        <section className="card mt-6 rounded-lg border border-medium/40 bg-card p-5"><h2 className="text-lg font-semibold">NOT CHECKED in the register</h2>
          <ul className="mt-2 grid gap-2 text-sm">{REGISTER.not_checked.map((n, i) => <li key={i}><span className="font-medium">{String((n as Record<string, unknown>).clause_ref ?? n.item ?? "Item")}</span> ({srcName(String((n as Record<string, unknown>).file ?? ""))}). <span className="text-muted">{String(n.reason ?? "")}</span></li>)}</ul></section>
      )}
    </div>
  );
}
