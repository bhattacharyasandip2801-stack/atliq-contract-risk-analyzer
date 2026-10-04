"use client";
import { createContext, useContext } from "react";
import type { Role } from "@/lib/types";
const Ctx = createContext<Role>("reviewer");
export function RoleProvider({ role, children }: { role: Role; children: React.ReactNode }) { return <Ctx.Provider value={role}>{children}</Ctx.Provider>; }
export const useRole = () => useContext(Ctx);
export const roleName = (r: Role) => (r === "seller" ? "Seller" : "Karandeep");
