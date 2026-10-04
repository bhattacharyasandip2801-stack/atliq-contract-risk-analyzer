import { NextResponse } from "next/server";
import { getBrief } from "@/lib/data";
import { getRole } from "@/lib/role";
import { sellerView } from "@/lib/seller";
export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const served = getBrief(slug);
  if (!served) return NextResponse.json({ error: "Unknown draft" }, { status: 404 });
  const role = new URL(req.url).searchParams.get("role") ?? (await getRole());
  if (role === "seller") return NextResponse.json({ role: "seller", brief: sellerView(served.brief) });
  return NextResponse.json({ role: "reviewer", quotes_checked: served.quotesChecked, findings_withheld: served.dropped, brief: served.brief });
}
