import Link from "next/link";
import { notFound } from "next/navigation";
import { getBrief } from "@/lib/data";
import { getRole } from "@/lib/role";
import { sellerView } from "@/lib/seller";
import BriefReviewer from "@/components/BriefReviewer";
import BriefSeller from "@/components/BriefSeller";
import AskBox from "@/components/AskBox";
import DecisionProgress from "@/components/DecisionProgress";
import { AuditOnMount, PrintButton } from "@/components/Small";

export const dynamic = "force-dynamic";

export default async function BriefPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const served = getBrief(slug);
  if (!served) notFound();
  const role = await getRole();
  const { brief, quotesChecked, dropped } = served;
  return (
    <div>
      <AuditOnMount action={role === "seller" ? "view brief (seller)" : "view brief"} target={slug} />
      <div className="no-print mb-4 flex flex-wrap items-center gap-3">
        <Link href="/" className="text-sm text-accent underline">← Queue</Link>
        {role === "reviewer" && <DecisionProgress big slug={brief.slug} ids={brief.findings.filter((f) => f.severity === "High").map((f) => f.id)} />}
        <div className="ml-auto"><PrintButton slug={slug} /></div>
      </div>
      {role === "seller" ? <BriefSeller s={sellerView(brief)} /> : <BriefReviewer brief={brief} quotesChecked={quotesChecked} dropped={dropped} />}
      <div className="mt-6"><AskBox slug={slug} /></div>
    </div>
  );
}
