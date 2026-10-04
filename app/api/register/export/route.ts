import { NextResponse } from "next/server";
import { REGISTER } from "@/lib/data";
import { getRole } from "@/lib/role";

const COUNSEL_TYPES = ["restrictive_covenant", "exclusivity", "mfn"];
const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""').replace(/\s+/g, " ")}"`;

export async function GET() {
  if ((await getRole()) === "seller") return NextResponse.json({ error: "The register is not available in the seller view." }, { status: 403 });
  const head = ["register_id", "contract", "counterparty", "atliq_signing_entity", "clause", "type", "plain_summary", "exact_quote", "start_date", "end_date", "how_term_runs", "binds_affiliates", "waiver_clause", "waiver_limit", "source_file", "register_coverage"];
  const rows = REGISTER.entries.filter((e) => COUNSEL_TYPES.includes(e.type)).map((e) => [
    e.id, e.contract, e.counterparty, e.atliq_entity, e.clause_ref, e.type, e.summary, e.quote, e.start_date, e.end_date, e.dates_note, e.binds_affiliates,
    e.waivers.map((w) => w.clause_ref).join("; "), e.waivers.map((w) => w.limit).join(" | "), e.file, "17 of about 30 signed contracts",
  ].map(esc).join(","));
  const csv = [head.map(esc).join(","), ...rows].join("\r\n");
  return new NextResponse("﻿" + csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="atliq_restrictive_terms_register.csv"' } });
}
