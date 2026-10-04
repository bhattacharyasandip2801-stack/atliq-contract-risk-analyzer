import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/role";
import { briefsFor } from "@/lib/data";
import { USERS, safeNext } from "@/lib/users";
import SignInCards from "@/components/SignInCards";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getUser()) redirect(safeNext(next));
  const people = USERS.map((u) => ({ ...u, drafts: briefsFor(u).length }));
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-nav text-base font-bold text-white" aria-hidden="true">Q</span>
        <div className="leading-tight"><div className="text-lg font-semibold">AtliQ Contract Risk Analyzer</div><div className="text-sm text-muted">Capstone prototype</div></div>
      </div>
      <h1 className="mt-6 text-2xl font-bold">Choose who you are</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        This is a demo sign-in: no password is needed, and nothing you do leaves this browser. Choose <b className="text-ink">Karandeep</b> to see the full prototype. Choose a seller to see the limited view. Production would use company single sign-on.
      </p>
      <div className="mt-5"><SignInCards people={people} next={safeNext(next)} /></div>
    </div>
  );
}
