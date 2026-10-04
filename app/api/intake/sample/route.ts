import { NextResponse } from "next/server";
import sources from "@/data/sources.json";
import { canSee, getBriefRaw } from "@/lib/data";
import { getUser } from "@/lib/role";

export async function GET(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  const b = getBriefRaw(slug);
  if (!b || !canSee(user, slug)) return NextResponse.json({ error: "Unknown draft" }, { status: 404 });
  const text = (sources as Record<string, string>)[b.draft_file];
  return NextResponse.json({ slug, counterparty: b.counterparty, geography: /contractor|subcontractor|vendor|partnership|freelanc/i.test(b.doc_type) ? "n/a" : /^USA|United States/i.test(b.client_country) ? "US" : /^India/i.test(b.client_country) ? "India" : /Saudi|Dubai|UAE|Oman|Middle/i.test(b.client_country) ? "Middle East" : /German|Europe|UK/i.test(b.client_country) ? "Europe" : "", text });
}
