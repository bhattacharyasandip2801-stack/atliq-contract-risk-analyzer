import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getRole } from "@/lib/role";
import { RoleProvider } from "@/components/RoleProvider";
import RoleSwitch from "@/components/RoleSwitch";

export const metadata: Metadata = {
  title: "AtliQ Contract Risk Analyzer (prototype)",
  description: "Capstone prototype: a ranked, cited brief for each incoming contract draft, built only from the capstone's synthetic dataset.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const role = await getRole();
  const link = "rounded px-2 py-1 text-sm text-ink hover:bg-accent-bg";
  return (
    <html lang="en">
      <body className="min-h-screen">
        <RoleProvider role={role}>
          <header className="no-print border-b border-rule bg-card">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
              <Link href="/" className="font-serif text-lg font-bold text-accent">AtliQ Contract Risk Analyzer</Link>
              <nav className="flex flex-wrap gap-1" aria-label="Main">
                <Link className={link} href="/">Queue</Link>
                {role === "reviewer" && <Link className={link} href="/register">Register</Link>}
                {role === "reviewer" && <Link className={link} href="/decisions">Decisions</Link>}
                {role === "reviewer" && <Link className={link} href="/evaluation">Evaluation</Link>}
                <Link className={link} href="/audit">Audit log</Link>
              </nav>
              <div className="ml-auto"><RoleSwitch /></div>
            </div>
            <div className="border-t border-rule bg-accent-bg px-4 py-1.5 text-center text-xs text-accent">
              Prototype on synthetic data. Briefs are pre-generated from the capstone dataset; every quote is re-checked against the source file each time a page loads. Not legal advice.
            </div>
          </header>
          <main className="mx-auto min-w-0 max-w-6xl px-4 py-6">{children}</main>
          <footer className="no-print mx-auto max-w-6xl px-4 pb-10 pt-4 text-xs text-muted">
            Capstone 2, AI Product Management cohort. Author: Sandip Gopal Bhattacharya. Decisions and the audit log are kept in this browser only.
          </footer>
        </RoleProvider>
      </body>
    </html>
  );
}
