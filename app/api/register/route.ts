import { NextResponse } from "next/server";
import { REGISTER } from "@/lib/data";
import { getRole } from "@/lib/role";
export async function GET(req: Request) {
  const role = new URL(req.url).searchParams.get("role") ?? (await getRole());
  if (role === "seller") return NextResponse.json({ error: "The register is not available in the seller view." }, { status: 403 });
  return NextResponse.json(REGISTER);
}
