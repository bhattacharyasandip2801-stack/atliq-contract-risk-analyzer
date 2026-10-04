import { NextResponse } from "next/server";
import { getUser } from "@/lib/role";
import { runIntake, type Geography } from "@/lib/intake";

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
  return NextResponse.json(runIntake({ text: body.text, geography, value, currency }, { reviewer: user.role === "reviewer" }));
}
