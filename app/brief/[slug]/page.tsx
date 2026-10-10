import Link from "next/link";
import { notFound } from "next/navigation";
import { canSee, getBrief } from "@/lib/data";
import { getUser } from "@/lib/role";
import { sellerView } from "@/lib/seller";
import BriefReviewer from "@/components/BriefReviewer";
import BriefSeller from "@/components/BriefSeller";
import AskBox from "@/components/AskBox";
import DecisionProgress from "@/components/DecisionProgress";
import { AuditOnMount, PrintButton } from "@/components/Small";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getUser();
  const served = getBrief(slug);
  if (!user || !served || !canSee(user, slug)) return { title: "Not found" };
  return { title: `${served.brief.counterparty}: ${served.brief.doc_type.replace(/\s*\(.*$/, "")}` };
}

export default async function BriefPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const served = getBrief(slug);
  if (!served) notFound();
  const user = (await getUser())!;
  if (!canSee(user, slug)) notFound();
  const role = user.role;
  const { brief, quotesChecked, dropped } = served;
  const highIds = brief.findings.filter((f) => f.severity === "High").map((f) => f.id);
  const c = { high: highIds.length, medium: brief.findings.filter((f) => f.severity === "Medium").length, low: brief.low.length };
  const jumps: [string, string][] = role === "seller"
    ? [["#top", "Summary"]]
    : [["#top", "Summary"], ...(c.high ? [["#high", `Decide before signing (${c.high})`] as [string, string]] : []), ...(c.medium ? [["#med", `Negotiate (${c.medium})`] as [string, string]] : []), ["#docs", "Documents needed"], ["#data", "Data type"], ["#nc", "Not checked"]];
  return (
    <div id="top">
      <AuditOnMount action={role === "seller" ? "view brief (seller)" : "view brief"} target={slug} />
      <nav aria-label="Breadcrumb" className="no-print mb-4 text-sm text-muted">
        <Link href="/" className="text-accent underline">Contract dashboard</Link> <span aria-hidden="true">/</span> <span className="text-ink">{brief.counterparty}</span>
      </nav>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0">
          {role === "seller" ? <BriefSeller s={sellerView(brief)} /> : <BriefReviewer brief={brief} quotesChecked={quotesChecked} dropped={dropped} />}
          <div className="mt-6"><AskBox slug={slug} /></div>
        </div>
        <aside aria-label="Brief summary" className="no-print order-first lg:order-none">
          <div className="card sticky top-4 grid gap-4 border border-rule bg-card p-4">
            <div>
              <div className="text-xs font-semibold text-muted">Status</div>
              {role === "reviewer" ? (
                <div className="mt-1.5 grid gap-1 text-sm">
                  <div className="flex justify-between"><span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-high" />Decide before signing</span><b>{c.high}</b></div>
                  <div className="flex justify-between"><span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-medium" />Negotiate</span><b>{c.medium}</b></div>
                  <div className="flex justify-between"><span><i className="mr-1.5 inline-block h-2 w-2 rounded-full bg-low" />For your information</span><b>{c.low}</b></div>
                  <div className="mt-1.5 border-t border-rule pt-1.5"><DecisionProgress big slug={brief.slug} ids={highIds} /></div>
                </div>
              ) : <p className="mt-1 text-sm text-muted">Brief ready. Counts are visible to the reviewer.</p>}
            </div>
            <div>
              <div className="text-xs font-semibold text-muted">On this page</div>
              <ul className="mt-1.5 grid gap-0.5 text-sm">{jumps.map(([h, t]) => <li key={h}><a className="block rounded px-2 py-1 text-ink hover:bg-accent-bg" href={h}>{t}</a></li>)}</ul>
            </div>
            <PrintButton slug={slug} />
          </div>
        </aside>
      </div>
    </div>
  );
}
