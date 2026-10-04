import { NextResponse } from "next/server";
import { sortedBriefs, highestSeverity, countBy, deadlineIso } from "@/lib/data";
import { getRole } from "@/lib/role";
export async function GET(req: Request) {
  const role = new URL(req.url).searchParams.get("role") ?? (await getRole());
  const seller = role === "seller";
  return NextResponse.json(sortedBriefs().map((b) => ({ slug: b.slug, counterparty: b.counterparty, doc_type: b.doc_type, deadline: deadlineIso(b.slug), highest_severity: highestSeverity(b), ...(seller ? {} : { counts: countBy(b) }) })));
}
