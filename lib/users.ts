// Demo people. Names and titles come from the PRD personas (Section 4.1) and the tracker's requested_by column.
// This is a demo sign-in: nobody has a password and the cookie is not signed. Production would use company single sign-on.
import type { Role } from "./types";
export const USER_COOKIE = "atliq_user";
export interface DemoUser { id: string; name: string; title: string; role: Role; access: string }

export const USERS: DemoUser[] = [
  { id: "karandeep", name: "Karandeep", title: "CEO, reviewer and signatory", role: "reviewer", access: "Full access: every draft, the register, the evaluation and the decision log." },
  { id: "dhaval", name: "Dhaval", title: "Founder, seller", role: "seller", access: "Limited view of the drafts Dhaval requested." },
  { id: "jay", name: "Jay", title: "Sales executive", role: "seller", access: "Limited view of the drafts Jay requested." },
  { id: "bhavin", name: "Bhavin", title: "Founder, seller", role: "seller", access: "Limited view of the drafts Bhavin requested." },
  { id: "pranav", name: "Pranav", title: "CTO and delivery lead", role: "seller", access: "Limited view of the drafts Pranav requested." },
];
export const userById = (id: string | undefined | null) => USERS.find((u) => u.id === id) ?? null;
/** Label written to the audit log and decision log. */
export const actorLabel = (u: DemoUser) => (u.role === "reviewer" ? u.name : `${u.name} (seller)`);
/** Only follow a same-site path after sign-in. */
export function safeNext(n: string | null | undefined) {
  return n && n.startsWith("/") && !n.startsWith("//") && !n.startsWith("/signin") && !n.includes("\\") ? n : "/";
}
