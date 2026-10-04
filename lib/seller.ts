import type { Brief } from "./types";

/** What a seller may see. Built from scratch from the redaction-safe fields only; nothing from register_refs, quotes,
 *  exposure lines or exception history is copied, so another client's commercial terms cannot leak through. */
export interface SellerBrief {
  slug: string; counterparty: string; doc_type: string; deadline: string | null; value: string;
  flags: { id: string; severity: string; type: string; text: string }[];
  missing_documents: string[];
  data_question: string | null;
  ask_karandeep: string[];
  notice: string;
}
export function sellerView(b: Brief): SellerBrief {
  return {
    slug: b.slug, counterparty: b.counterparty, doc_type: b.doc_type, deadline: b.deadline, value: b.value,
    flags: b.findings.map((f) => ({
      id: f.id, severity: f.severity, type: f.type,
      text: f.seller_text && f.seller_text.trim() ? f.seller_text : "A point needs Karandeep's review; ask Karandeep.",
    })),
    missing_documents: b.seller_view.missing_documents,
    data_question: b.data_class.question,
    ask_karandeep: b.seller_view.ask_karandeep,
    notice: "Seller view: other clients' commercial terms and clause quotes are hidden. Ask Karandeep for details.",
  };
}
