import { NextResponse } from "next/server";
import { REGISTER } from "@/lib/data";
import { getUser } from "@/lib/role";
export async function GET(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (user.role === "seller" || new URL(req.url).searchParams.get("role") === "seller") return NextResponse.json({ error: "The register is not available in the seller view." }, { status: 403 });
  return NextResponse.json(REGISTER);
}
