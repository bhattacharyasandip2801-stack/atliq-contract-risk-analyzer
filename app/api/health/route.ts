import { NextResponse } from "next/server";
import { allBriefs, REGISTER } from "@/lib/data";
export async function GET() {
  return NextResponse.json({ status: "ok", drafts: allBriefs().length, register_entries: REGISTER.entries.length, register_coverage: REGISTER.meta.coverage, mode: "stored briefs (live analysis not enabled)", data: "synthetic capstone dataset" });
}
