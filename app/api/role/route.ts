import { NextResponse } from "next/server";

// Replaced by the demo sign-in (/api/signin). Kept as a stub so older copies of the front end get a clear answer.
export async function POST() {
  return NextResponse.json({ error: "The role switch was replaced by sign-in. Use /api/signin." }, { status: 410 });
}
