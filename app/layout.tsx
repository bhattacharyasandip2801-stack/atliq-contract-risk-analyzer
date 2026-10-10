import type { Metadata } from "next";
import "./globals.css";
import { getUser } from "@/lib/role";
import { RoleProvider } from "@/components/RoleProvider";
import Sidebar from "@/components/Sidebar";
import { MobileBar } from "@/components/SignedIn";
import { DemoPanel } from "@/components/UserDemo";
import BackToDashboard from "@/components/BackToDashboard";

export const metadata: Metadata = {
  title: { default: "AtliQ Contract Risk Analyzer (prototype)", template: "%s · AtliQ Contract Risk Analyzer" },
  description: "Capstone prototype: a ranked, cited brief for each incoming contract draft, built only from the capstone's synthetic dataset.",
};

const Footer = ({ className = "", author = false }: { className?: string; author?: boolean }) => (
  <footer className={`mx-auto max-w-6xl px-4 pb-10 pt-2 text-xs text-muted lg:px-8 ${className}`}>
    <p className="border-t border-rule pt-4">
      <span className="font-semibold">Disclaimer.</span> Prototype on synthetic data. Every quote is re-checked against its source file each time a page loads. Not legal advice.
    </p>
    {author && <p className="mt-2">Capstone 2, AI Product Management cohort. Author: Sandip Gopal Bhattacharya.</p>}
  </footer>
);

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getUser();
  const role = user?.role ?? "seller";
  return (
    <html lang="en">
      <body className="min-h-screen">
        <RoleProvider role={role} user={user}>
          {user ? (
            <>
              <Sidebar />
              <div className="lg:pl-60">
                <MobileBar />
                <main className="mx-auto min-w-0 max-w-6xl px-4 py-6 lg:px-8"><BackToDashboard />{children}</main>
                <Footer />
              </div>
              <DemoPanel />
            </>
          ) : (
            <>
              <main className="mx-auto min-w-0 max-w-5xl px-4 py-10">{children}</main>
              <Footer author className="max-w-5xl lg:px-4" />
            </>
          )}
        </RoleProvider>
      </body>
    </html>
  );
}
