import { cookies } from "next/headers";
import type { Role } from "./types";
import { USER_COOKIE, userById, type DemoUser } from "./users";
export async function getUser(): Promise<DemoUser | null> {
  return userById((await cookies()).get(USER_COOKIE)?.value);
}
/** Fails closed: with no valid sign-in the role is the limited one. */
export async function getRole(): Promise<Role> {
  return (await getUser())?.role ?? "seller";
}
