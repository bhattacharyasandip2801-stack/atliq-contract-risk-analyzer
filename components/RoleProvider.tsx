"use client";
import { createContext, useContext } from "react";
import type { Role } from "@/lib/types";
import { actorLabel, type DemoUser } from "@/lib/users";
const RoleCtx = createContext<Role>("seller");
const UserCtx = createContext<DemoUser | null>(null);
export function RoleProvider({ role, user, children }: { role: Role; user: DemoUser | null; children: React.ReactNode }) {
  return <RoleCtx.Provider value={role}><UserCtx.Provider value={user}>{children}</UserCtx.Provider></RoleCtx.Provider>;
}
export const useRole = () => useContext(RoleCtx);
export const useUser = () => useContext(UserCtx);
/** Name written to the audit log, for example "Karandeep" or "Jay (seller)". */
export function useActor() { const u = useUser(); return u ? actorLabel(u) : "Not signed in"; }
