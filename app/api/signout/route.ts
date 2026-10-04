import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { USER_COOKIE } from "@/lib/users";

export async function POST() {
  (await cookies()).delete(USER_COOKIE);
  return NextResponse.json({ ok: true });
}
