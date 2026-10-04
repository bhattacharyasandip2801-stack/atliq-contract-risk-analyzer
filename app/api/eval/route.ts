import { NextResponse } from "next/server";
import { runEvaluation } from "@/lib/eval";
export async function GET() { return NextResponse.json(runEvaluation()); }
