import { NextResponse } from "next/server";
import { canSee, getBrief } from "@/lib/data";
import { getUser } from "@/lib/role";
import { sellerView } from "@/lib/seller";
export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const served = getBrief(slug);
  if (!served || !canSee(user, slug)) return NextResponse.json({ error: "Unknown draft" }, { status: 404 });
  const seller = user.role === "seller" || new URL(req.url).searchParams.get("role") === "seller";
  if (seller) return NextResponse.json({ role: "seller", brief: sellerView(served.brief) });
  return NextResponse.json({ role: "reviewer", quotes_checked: served.quotesChecked, findings_withheld: served.dropped, brief: served.brief });
}
