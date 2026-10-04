import { NextResponse } from "next/server";
import { runEvaluation } from "@/lib/eval";
import { getRole } from "@/lib/role";
export async function GET() {
  if ((await getRole()) === "seller") return NextResponse.json({ error: "The evaluation is not available in the seller view." }, { status: 403 });
  return NextResponse.json(runEvaluation());
}
