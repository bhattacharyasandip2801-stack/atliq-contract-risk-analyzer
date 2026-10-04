import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { USER_COOKIE, userById } from "@/lib/users";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { user?: string };
  const user = userById(body.user);
  if (!user) return NextResponse.json({ error: "Unknown person." }, { status: 400 });
  (await cookies()).set(USER_COOKIE, user.id, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
  return NextResponse.json({ user: user.id, name: user.name, role: user.role });
}
