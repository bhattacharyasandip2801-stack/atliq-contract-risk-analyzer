import type { SellerBrief } from "@/lib/seller";
import { Chip, SeverityBadge, TYPE_LABEL } from "./Badges";

export default function BriefSeller({ s }: { s: SellerBrief }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <section className="card rounded-lg border border-rule bg-card p-5">
        <Chip tone="accent">Seller view</Chip>
        <h1 className="mt-2 text-3xl font-bold">{s.counterparty}</h1>
        <p className="text-muted">{s.doc_type}</p>
        <p className="mt-3 text-sm">Deadline: {s.deadline ?? "none in the notes"} · Value: {s.value}</p>
        <p className="mt-3 rounded bg-low-bg px-3 py-2 text-sm">{s.notice}</p>
      </section>
      <section className="card rounded-lg border border-rule bg-card p-5">
        <h2 className="text-xl font-bold">Flags ({s.flags.length})</h2>
        {s.flags.length === 0 ? <p className="mt-2 text-sm">No flags raised on this draft.</p> : (
          <ul className="mt-3 grid gap-3">{s.flags.map((f) => (
            <li key={f.id} className="border-t border-rule pt-3 first:border-0 first:pt-0"><div className="flex flex-wrap items-center gap-2"><SeverityBadge s={f.severity} /><Chip tone="accent">{TYPE_LABEL[f.type] ?? f.type}</Chip></div><p className="mt-1 text-sm">{f.text}</p></li>
          ))}</ul>
        )}
      </section>
      <section className="card rounded-lg border border-rule bg-card p-5">
        <h2 className="text-xl font-bold">What is missing</h2>
        {s.missing_documents.length === 0 ? <p className="mt-2 text-sm">No missing documents flagged.</p> : <ul className="mt-3 list-disc pl-5 text-sm">{s.missing_documents.map((m, i) => <li key={i}>{m}</li>)}</ul>}
        {s.data_question && <p className="mt-3 rounded border border-medium/30 bg-medium-bg p-3 text-sm"><span className="font-semibold">Question for a person: </span>{s.data_question}</p>}
      </section>
      <section className="card rounded-lg border border-rule bg-card p-5">
        <h2 className="text-xl font-bold">Ask Karandeep</h2>
        {s.ask_karandeep.length === 0 ? <p className="mt-2 text-sm">Nothing to ask.</p> : <ul className="mt-3 list-disc pl-5 text-sm">{s.ask_karandeep.map((m, i) => <li key={i}>{m}</li>)}</ul>}
      </section>
    </div>
  );
}
