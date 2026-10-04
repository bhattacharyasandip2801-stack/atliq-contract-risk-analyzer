import { cookies } from "next/headers";
import type { Role } from "./types";
export const ROLE_COOKIE = "atliq_role";
export async function getRole(): Promise<Role> {
  const c = await cookies();
  return c.get(ROLE_COOKIE)?.value === "seller" ? "seller" : "reviewer";
}
