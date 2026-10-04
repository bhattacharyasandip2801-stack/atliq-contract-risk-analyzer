import type { Metadata } from "next";
import { briefsFor } from "@/lib/data";
import { getUser } from "@/lib/role";
import IntakeForm from "@/components/IntakeForm";
import { AuditOnMount } from "@/components/Small";

export const metadata: Metadata = { title: "Check a new draft" };
export const dynamic = "force-dynamic";

export default async function IntakePage() {
  const user = await getUser();
  const samples = user ? briefsFor(user).map((b) => ({ slug: b.slug, label: `${b.counterparty}: ${b.doc_type.split("(")[0].trim()}` })) : [];
  const reviewer = user?.role === "reviewer";
  return (
    <div>
      <AuditOnMount action="view check a new draft" target="intake" />
      <h1 className="text-2xl font-bold">Check a new draft</h1>
      <p className="mt-2 max-w-3xl text-muted">Paste a contract, upload a text file, or pick a draft from the dataset, and get a first read in seconds: entity and country, governing law, delay damages with the amount per day, liability, indemnity, payment, termination, IP, promises AtliQ has already made, mutual-in-name NDAs, data type and missing attachments. {reviewer ? "" : "You see flags and questions; what AtliQ has signed with other clients stays hidden. "}Every finding quotes your text. Real patient or personal data stops the check.</p>
      <p className="mt-2 max-w-3xl rounded-lg border border-rule bg-card p-3 text-sm text-muted">This is a <span className="font-semibold text-ink">rule check</span>, not the full brief. The 15 briefs in the queue were written and quote-checked in depth. Rules cannot read what they have no pattern for, so the result always lists what was <span className="font-semibold text-ink">not checked</span>.</p>
      <div className="mt-5"><IntakeForm samples={samples} /></div>
    </div>
  );
}
