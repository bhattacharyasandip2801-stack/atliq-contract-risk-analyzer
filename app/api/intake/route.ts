import { NextResponse } from "next/server";
import { getUser } from "@/lib/role";
import { runIntake, type Geography } from "@/lib/intake";
import { getBrief, matchSample, countBy } from "@/lib/data";

const GEOS = ["", "US", "India", "Middle East", "Europe", "Other", "n/a"];
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  let body: { text?: unknown; geography?: unknown; value?: unknown; currency?: unknown } = {};
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Send JSON with a text field." }, { status: 400 }); }
  if (typeof body.text !== "string") return NextResponse.json({ error: "Send JSON with a text field." }, { status: 400 });
  const geography = (typeof body.geography === "string" && GEOS.includes(body.geography) ? body.geography : "") as Geography;
  const value = typeof body.value === "number" && body.value > 0 && body.value < 1e12 ? body.value : null;
  const currency = typeof body.currency === "string" && ["$", "₹", "€", "£"].includes(body.currency) ? body.currency : "";
  // Nothing is stored. The text is read and dropped.
  const result = runIntake({ text: body.text, geography, value, currency }, { reviewer: user.role === "reviewer" });
  // If the text is exactly one of the simulated test contracts, the reviewer also gets that contract's stored, quote-checked brief.
  const slug = user.role === "reviewer" ? matchSample(body.text) : null;
  const served = slug ? getBrief(slug) : null;
  if (!served) return NextResponse.json(result);
  const b = served.brief, c = countBy(b);
  return NextResponse.json({ ...result, stored: { slug: b.slug, counterparty: b.counterparty, doc_type: b.doc_type, headline: b.headline, high: c.high, medium: c.medium, low: c.low, quotes_checked: served.quotesChecked, withheld: served.dropped.length, findings: b.findings.map((f) => ({ id: f.id, severity: f.severity, title: f.title, clause_ref: f.clause_ref })) } });
}
