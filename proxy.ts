import { NextResponse, type NextRequest } from "next/server";
import { USER_COOKIE, userById } from "@/lib/users";

const PUBLIC = new Set(["/signin", "/api/signin", "/api/signout", "/api/health"]);

// Demo sign-in gate: send visitors without a (valid) person to the sign-in page. Pages and API routes also check the person themselves.
export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (PUBLIC.has(pathname)) return NextResponse.next();
  if (userById(req.cookies.get(USER_COOKIE)?.value)) return NextResponse.next();
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Sign in first: POST /api/signin with {\"user\":\"karandeep\"}." }, { status: 401 });
  }
  const url = new URL("/signin", req.url);
  if (pathname !== "/") url.searchParams.set("next", pathname + search);
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"] };
