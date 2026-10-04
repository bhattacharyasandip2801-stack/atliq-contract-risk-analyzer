import type { Metadata } from "next";
import "./globals.css";
import { getRole } from "@/lib/role";
import { RoleProvider } from "@/components/RoleProvider";
import RoleSwitch from "@/components/RoleSwitch";
import Sidebar from "@/components/Sidebar";
import { DemoPanel, DemoStartButton } from "@/components/UserDemo";

export const metadata: Metadata = {
  title: { default: "AtliQ Contract Risk Analyzer (prototype)", template: "%s · AtliQ Contract Risk Analyzer" },
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
              <DemoStartButton variant="compact" />
              <div className="flex items-center gap-2"><span className="text-xs text-muted">Viewing as</span><div className="w-44"><RoleSwitch light /></div></div>
            </div>
            <main className="mx-auto min-w-0 max-w-6xl px-4 py-6 lg:px-8">{children}</main>
            <footer className="mx-auto max-w-6xl px-4 pb-10 pt-2 text-xs text-muted lg:px-8">
              <p className="border-t border-rule pt-4">
                <span className="font-semibold">Disclaimer.</span> Prototype on synthetic data. Briefs are pre-generated from the capstone dataset; every quote is re-checked against its source file each time a page loads. Not legal advice.
              </p>
              <p className="mt-2">Capstone 2, AI Product Management cohort. Author: Sandip Gopal Bhattacharya.</p>
            </footer>
          </div>
          <DemoPanel />
        </RoleProvider>
      </body>
    </html>
  );
}
