import { NextResponse } from "next/server";
import { briefsFor, highestSeverity, countBy, deadlineIso } from "@/lib/data";
import { getUser } from "@/lib/role";
export async function GET(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const seller = user.role === "seller" || new URL(req.url).searchParams.get("role") === "seller";
  return NextResponse.json(briefsFor(user).map((b) => ({ slug: b.slug, counterparty: b.counterparty, doc_type: b.doc_type, deadline: deadlineIso(b.slug), highest_severity: highestSeverity(b), ...(seller ? {} : { counts: countBy(b) }) })));
}
