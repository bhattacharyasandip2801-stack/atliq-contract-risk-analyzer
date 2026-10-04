import { NextResponse } from "next/server";
import { getUser } from "@/lib/role";
import { searchKnowledge, KB_STATS, type Kind } from "@/lib/knowledge";

const KINDS: Kind[] = ["Signed contract", "Incoming draft", "Meeting note", "Negotiation notes", "Karandeep's checklist", "Entity sheet", "Tracker"];
export async function GET(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (user.role !== "reviewer") return NextResponse.json({ error: "The knowledge base holds other clients' contract text, so it is not available in the seller view." }, { status: 403 });
  const sp = new URL(req.url).searchParams;
  const q = (sp.get("q") ?? "").slice(0, 300);
  const kind = sp.get("kind") as Kind | null;
  const hits = searchKnowledge(q, { k: 8, kinds: kind && KINDS.includes(kind) ? [kind] : undefined });
  return NextResponse.json({ query: q, stats: KB_STATS(), hits: hits.map((h) => ({ file: h.file, kind: h.kind, title: h.title, section: h.section, passage: h.text, score: Math.round(h.score * 100) / 100 })) });
}
