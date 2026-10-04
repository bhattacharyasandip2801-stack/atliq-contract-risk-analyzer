import type { Metadata } from "next";
import "./globals.css";
import { getRole } from "@/lib/role";
import { RoleProvider } from "@/components/RoleProvider";
import RoleSwitch from "@/components/RoleSwitch";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "AtliQ Contract Risk Analyzer (prototype)",
  description: "Capstone prototype: a ranked, cited brief for each incoming contract draft, built only from the capstone's synthetic dataset.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const role = await getRole();
  return (
    <html lang="en">
      <body className="min-h-screen">
        <RoleProvider role={role}>
          <Sidebar />
          <div className="lg:pl-60">
            <div className="no-print flex items-center justify-between gap-3 border-b border-rule bg-card px-4 py-2 lg:hidden">
              <span className="text-xs text-muted">Viewing as</span>
              <div className="w-48"><RoleSwitch /></div>
            </div>
            <div role="note" aria-label="Prototype notice" className="no-print border-b border-rule bg-accent-bg px-4 py-1.5 text-xs text-accent">
              Prototype on synthetic data. Briefs are pre-generated from the capstone dataset; every quote is re-checked against its source file each time a page loads.
            </div>
            <main className="mx-auto min-w-0 max-w-6xl px-4 py-6 lg:px-8">{children}</main>
            <footer className="no-print mx-auto max-w-6xl px-4 pb-10 pt-2 text-xs text-muted lg:px-8">
              Capstone 2, AI Product Management cohort. Author: Sandip Gopal Bhattacharya.
            </footer>
          </div>
        </RoleProvider>
      </body>
    </html>
  );
}
