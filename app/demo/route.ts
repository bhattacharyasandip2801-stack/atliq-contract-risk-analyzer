import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { USER_COOKIE } from "@/lib/users";

// One-click demo: signs in as Karandeep (the reviewer view) and opens the dashboard. Demo data only; the demo sign-in has no passwords.
// Use /signin to pick another person, for example a seller.
export async function GET(req: Request) {
  (await cookies()).set(USER_COOKIE, "karandeep", { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
  return NextResponse.redirect(new URL("/", req.url));
}
