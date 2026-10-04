import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ROLE_COOKIE } from "@/lib/role";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { role?: string };
  const role = body.role === "seller" ? "seller" : "reviewer";
  (await cookies()).set(ROLE_COOKIE, role, { path: "/", httpOnly: false, sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
  return NextResponse.json({ role });
}
