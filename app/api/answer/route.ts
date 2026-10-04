import { NextResponse } from "next/server";
import { getUser } from "@/lib/role";
import { searchKnowledge } from "@/lib/knowledge";
import { aiStatus, answerFromPassages } from "@/lib/answer";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (user.role !== "reviewer") return NextResponse.json({ error: "Not available in the seller view." }, { status: 403 });
  const s = aiStatus();
  return NextResponse.json({ enabled: s.enabled, provider: s.provider ?? null, model: s.model ?? null, missing: s.missing });
}
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (user.role !== "reviewer") return NextResponse.json({ error: "Not available in the seller view." }, { status: 403 });
  let q = "";
  try { q = String(((await req.json()) as { q?: unknown }).q ?? "").slice(0, 300); } catch { /* empty */ }
  if (q.trim().length < 3) return NextResponse.json({ error: "Ask a question of at least three characters." }, { status: 400 });
  // The passages come from our own search, never from the caller, so the model can only see verified text.
  const hits = searchKnowledge(q, { k: 6 });
  const r = await answerFromPassages(q, hits, user.id);
  return NextResponse.json(r);
}
